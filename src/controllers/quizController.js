const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Attempt = require("../models/Attempt");
const Result = require("../models/Result");
const { generateQuestions } = require("../services/aiService");
const { gradeAttempt, buildAnalysis } = require("../services/gradingService");
const { updateStatistics } = require("../services/statisticsService");
const {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} = require("../utils/errors");
const {
  successResponse,
  paginate,
  buildPaginatedResponse,
  stripAnswers,
} = require("../utils/helpers");

// Import Giám khảo AI
const { gradeEssay } = require("../services/aiGradingService");

const canManageQuiz = (user, quiz) => {
  if (!user) return false;
  if (user.role === "admin" || user.role === "superadmin") return true;
  const createdBy = quiz.createdBy?._id || quiz.createdBy;
  return createdBy?.toString() === user._id.toString();
};

const listQuizzes = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { hskLevel, search, generatedByAI } = req.query;

    const isAdmin =
      req.user && (req.user.role === "admin" || req.user.role === "superadmin");
    const isTeacher = req.user && req.user.role === "teacher";
    const filter = isAdmin
      ? {}
      : isTeacher
        ? { $or: [{ isPublished: true }, { createdBy: req.user._id }] }
        : { isPublished: true };
    if (hskLevel) filter.hskLevel = Number(hskLevel);
    if (generatedByAI !== undefined)
      filter.generatedByAI = generatedByAI === "true";
    if (search) filter.$text = { $search: search };

    const [quizzes, total, userAttempts] = await Promise.all([
      Quiz.find(filter)
        .populate("createdBy", "username fullName")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Quiz.countDocuments(filter),
      req.user ? Attempt.find({ userId: req.user._id }).select("quizId") : [],
    ]);

    const attemptMap = userAttempts.reduce((acc, curr) => {
      acc[curr.quizId.toString()] = (acc[curr.quizId.toString()] || 0) + 1;
      return acc;
    }, {});

    const quizzesWithAttempts = quizzes.map((quiz) => {
      const plainQuiz = quiz.toObject();
      plainQuiz.userAttemptsCount = attemptMap[quiz._id.toString()] || 0;
      return plainQuiz;
    });

    return successResponse(
      res,
      buildPaginatedResponse(quizzesWithAttempts, total, page, limit),
      "Quizzes retrieved",
    );
  } catch (err) {
    next(err);
  }
};

const generateQuiz = async (req, res, next) => {
  try {
    const {
      title,
      description,
      hskLevel,
      numberOfQuestions,
      duration,
      passingScore,
      topics,
      questionTypes,
    } = req.body;

    const aiQuestions = await generateQuestions({
      hskLevel,
      numberOfQuestions,
      topics,
      questionTypes,
    });

    const quiz = await Quiz.create({
      title,
      description,
      hskLevel,
      totalQuestions: aiQuestions.length,
      duration,
      passingScore,
      generatedByAI: true,
      aiGeneratedAt: new Date(),
      createdBy: req.user._id,
    });

    const questions = await Question.insertMany(
      aiQuestions.map((q) => ({ ...q, quizId: quiz._id })),
    );

    quiz.questionIds = questions.map((q) => q._id);
    await quiz.save();

    return successResponse(
      res,
      { quiz, questions },
      "Quiz generated successfully",
      201,
    );
  } catch (err) {
    next(err);
  }
};

const createQuiz = async (req, res, next) => {
  try {
    const {
      title,
      description,
      hskLevel,
      totalQuestions,
      duration,
      passingScore,
      questionIds,
      isPublished,
    } = req.body;

    const quiz = await Quiz.create({
      title,
      description,
      hskLevel,
      totalQuestions,
      duration,
      passingScore,
      questionIds: questionIds || [],
      isPublished,
      createdBy: req.user._id,
    });

    return successResponse(res, { quiz }, "Quiz created successfully", 201);
  } catch (err) {
    next(err);
  }
};

const getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).populate(
      "createdBy",
      "username fullName",
    );
    if (!quiz) throw new NotFoundError("Quiz not found");
    if (!quiz.isPublished && !canManageQuiz(req.user, quiz)) {
      throw new ForbiddenError("You do not have permission to view this quiz");
    }

    const questions = await Question.find({ quizId: quiz._id });
    const order = new Map(
      quiz.questionIds.map((id, index) => [id.toString(), index]),
    );
    questions.sort(
      (a, b) =>
        (order.get(a._id.toString()) ?? 0) - (order.get(b._id.toString()) ?? 0),
    );
    const safeQuestions = questions.map(stripAnswers);

    return successResponse(
      res,
      { quiz, questions: safeQuestions },
      "Quiz retrieved",
    );
  } catch (err) {
    next(err);
  }
};

const updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) throw new NotFoundError("Quiz not found");

    if (!canManageQuiz(req.user, quiz)) throw new ForbiddenError();

    const allowedFields = [
      "title",
      "description",
      "hskLevel",
      "duration",
      "passingScore",
      "isPublished",
    ];
    const update = Object.fromEntries(
      allowedFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, req.body[field]]),
    );
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.quizId,
      update,
      {
        new: true,
        runValidators: true,
      },
    );

    return successResponse(res, { quiz: updatedQuiz }, "Quiz updated");
  } catch (err) {
    next(err);
  }
};

const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) throw new NotFoundError("Quiz not found");

    await Question.deleteMany({ quizId: quiz._id });
    await quiz.deleteOne();

    return successResponse(res, null, "Quiz deleted");
  } catch (err) {
    next(err);
  }
};

const submitQuiz = async (req, res, next) => {
  try {
    console.log("\n🚀🚀🚀 [BÁO ĐỘNG] APP ĐÃ GỌI VÀO ĐÚNG QUIZ CONTROLLER!");

    const { quizId, answers } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw new NotFoundError("Quiz not found");

    const questions = await Question.find({ quizId: quiz._id });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    answers.forEach((answer) => {
      if (!questionMap.has(answer.questionId)) {
        throw new ValidationError(
          "Answer contains a question that does not belong to this quiz",
        );
      }
    });

    let {
      gradedAnswers,
      totalScore,
      percentage,
      passed,
      correctAnswers,
      wrongAnswers,
      answeredQuestions,
    } = gradeAttempt(questions, answers, quiz);

    let hasEssay = false;
    let maxPossibleScore = questions.reduce(
      (sum, q) => sum + (q.points || 1),
      0,
    );

    for (const answer of gradedAnswers) {
      const question = questionMap.get(answer.questionId.toString());

      // Mẻ lưới quét sạch: Bắt tất cả tự luận/viết ngắn
      if (
        question &&
        question.questionType !== "multiple_choice" &&
        question.questionType !== "fill_blank"
      ) {
        hasEssay = true;

        console.log(`\n🤖 [AI ĐANG CHẤM BÀI] Câu hỏi: ${question.content}`);
        console.log(`📝 [BÀI LÀM CỦA BẠN]: ${answer.userAnswer}`);

        const aiResult = await gradeEssay(
          question.content,
          answer.userAnswer,
          question.points || 10,
        );

        console.log(
          `✅ [KẾT QUẢ AI] Điểm: ${aiResult.pointsEarned} | Lời phê: ${aiResult.feedback}\n`,
        );

        const pts = Number(aiResult.pointsEarned ?? aiResult.points ?? 0);
        answer.isCorrect = !!aiResult.isCorrect;
        answer.pointsEarned = isNaN(pts) ? 0 : pts;
        answer.explanation = aiResult.feedback || "";
        answer.correctAnswer = "Chấm điểm bởi AI";

        await Question.findByIdAndUpdate(question._id, {
          explanation: answer.explanation,
        });
      }
    }

    if (hasEssay) {
      totalScore = 0;
      correctAnswers = 0;
      wrongAnswers = 0;

      for (const answer of gradedAnswers) {
        totalScore += answer.pointsEarned || 0;
        if (answer.isCorrect) correctAnswers++;
        else wrongAnswers++;
      }

      percentage =
        maxPossibleScore > 0
          ? Math.round((totalScore / maxPossibleScore) * 100)
          : 0;
      passed = totalScore >= (quiz.passingScore || 0);
    }

    const attempt = await Attempt.create({
      userId: req.user._id,
      quizId: quiz._id,
      submittedAt: new Date(),
      totalScore,
      passedStatus: passed,
      status: "submitted",
      answers: gradedAnswers,
      summary: {
        totalQuestions: questions.length,
        answeredQuestions,
        correctAnswers,
        wrongAnswers,
        percentage,
      },
    });

    const analysis = buildAnalysis(questions, gradedAnswers);
    const resultAnswers = gradedAnswers.map((answer) => {
      const question = questions.find(
        (q) => q._id.toString() === answer.questionId.toString(),
      );
      return {
        questionId: answer.questionId,
        questionContent: question ? question.content : "",
        questionType: question ? question.questionType : "",
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        pointsEarned: answer.pointsEarned,
        explanation: answer.explanation,
        timeSpent: answer.timeSpent,
      };
    });

    const result = await Result.create({
      attemptId: attempt._id,
      userId: req.user._id,
      quizId: quiz._id,
      score: totalScore,
      percentage,
      passed,
      timeSpent: 0,
      correctAnswers,
      wrongAnswers,
      analysis,
      answers: resultAnswers,
    });

    await updateStatistics(
      req.user._id,
      { ...result.toObject(), answers: resultAnswers },
      quiz,
    );

    quiz.totalAttempts += 1;
    quiz.averageScore = Math.round(
      (quiz.averageScore * (quiz.totalAttempts - 1) + totalScore) /
        quiz.totalAttempts,
    );
    await quiz.save();

    console.log("🏁 [HOÀN TẤT] Lời phê đã được lưu thành công!");
    return successResponse(res, { attempt }, "Quiz submitted successfully");
  } catch (err) {
    console.error("❌ [LỖI RỒI]:", err);
    next(err);
  }
};

const getAttempts = async (req, res, next) => {
  try {
    const { quizId } = req.query;
    const filter = { userId: req.user._id };
    if (quizId) filter.quizId = quizId;

    const attempts = await Attempt.find(filter)
      .populate("quizId", "title hskLevel")
      .sort({ createdAt: -1 });

    return successResponse(res, attempts, "Attempts retrieved");
  } catch (err) {
    next(err);
  }
};

const getAttempt = async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate("quizId", "title hskLevel")
      .populate("answers.questionId");
    if (!attempt) throw new NotFoundError("Attempt not found");

    if (attempt.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError(
        "You do not have permission to view this attempt",
      );
    }

    return successResponse(res, attempt, "Attempt retrieved");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listQuizzes,
  generateQuiz,
  createQuiz,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getAttempts,
  getAttempt,
};
