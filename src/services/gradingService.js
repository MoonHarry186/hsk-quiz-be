const { normalizeString } = require('../utils/helpers');

const gradeAnswer = (question, userAnswer) => {
  const { questionType, multipleChoice, fillBlank, points } = question;
  let isCorrect = false;
  let correctAnswer = null;

  if (questionType === 'multiple_choice') {
    correctAnswer = multipleChoice.correctAnswer;
    isCorrect =
      userAnswer !== null &&
      userAnswer !== undefined &&
      Number(userAnswer) === correctAnswer;
  } else if (questionType === 'fill_blank') {
    correctAnswer = fillBlank.blanks;
    if (Array.isArray(userAnswer) && Array.isArray(fillBlank.blanks)) {
      isCorrect =
        userAnswer.length === fillBlank.blanks.length &&
        userAnswer.every((ans, i) => normalizeString(ans) === normalizeString(fillBlank.blanks[i]));
    } else if (typeof userAnswer === 'string' && fillBlank.blanks.length === 1) {
      isCorrect = normalizeString(userAnswer) === normalizeString(fillBlank.blanks[0]);
    }
  } else if (questionType === 'essay') {
    isCorrect = false;
    correctAnswer = null;
  }

  const pointsEarned = isCorrect ? (points || 1) : 0;

  return { isCorrect, correctAnswer, pointsEarned };
};

const gradeAttempt = (questions, answers, quiz) => {
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));
  const answerMap = new Map();
  (answers || []).forEach((answer) => {
    const raw = typeof answer.toObject === 'function' ? answer.toObject() : answer;
    if (raw.questionId) answerMap.set(raw.questionId.toString(), raw);
  });

  let earnedScore = 0;
  let maxScore = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let answeredQuestions = 0;

  const gradedAnswers = questions.map((question) => {
    const questionId = question._id;
    const raw = answerMap.get(questionId.toString());
    const userAnswer = raw ? raw.userAnswer : null;
    maxScore += question.points || 1;

    const { isCorrect, correctAnswer, pointsEarned } = gradeAnswer(question, userAnswer);

    if (raw) answeredQuestions += 1;
    if (isCorrect) {
      correctAnswers += 1;
      earnedScore += pointsEarned;
    } else {
      wrongAnswers += 1;
    }

    return {
      questionId,
      userAnswer,
      timeSpent: raw?.timeSpent || 0,
      submittedAt: raw?.submittedAt || new Date(),
      isCorrect,
      pointsEarned,
      correctAnswer,
      explanation: question.explanation || '',
    };
  });

  (answers || [])
    .map((answer) => (typeof answer.toObject === 'function' ? answer.toObject() : answer))
    .filter((answer) => answer.questionId && !questionMap.has(answer.questionId.toString()))
    .forEach((answer) => {
      gradedAnswers.push({
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        timeSpent: answer.timeSpent || 0,
        submittedAt: answer.submittedAt || new Date(),
        isCorrect: false,
        pointsEarned: 0,
        correctAnswer: null,
        explanation: '',
      });
    });

  const percentage = maxScore > 0 ? Math.round((earnedScore / maxScore) * 100) : 0;
  const passed = percentage >= (quiz.passingScore || 70);

  return {
    gradedAnswers,
    totalScore: percentage,
    earnedScore,
    maxScore,
    percentage,
    passed,
    correctAnswers,
    wrongAnswers,
    answeredQuestions,
  };
};

const buildAnalysis = (questions, gradedAnswers) => {
  const typeMap = {};

  gradedAnswers.forEach((answer) => {
    if (!answer.questionId) return;
    const question = questions.find((q) => q._id.toString() === answer.questionId.toString());
    if (!question) return;

    const type = question.questionType;
    if (!typeMap[type]) {
      typeMap[type] = { correct: 0, total: 0 };
    }
    typeMap[type].total += 1;
    if (answer.isCorrect) typeMap[type].correct += 1;
  });

  const byQuestionType = Object.entries(typeMap).map(([type, stats]) => ({
    type,
    correct: stats.correct,
    total: stats.total,
    percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));

  const strengths = byQuestionType
    .filter((s) => s.percentage >= 70)
    .map((s) => `Strong performance in ${s.type.replace('_', ' ')} questions (${s.percentage}%)`);

  const weaknesses = byQuestionType
    .filter((s) => s.percentage < 70)
    .map((s) => `Needs improvement in ${s.type.replace('_', ' ')} questions (${s.percentage}%)`);

  const recommendations = [];
  if (weaknesses.length > 0) {
    recommendations.push('Review the topics where you made mistakes.');
    recommendations.push('Practice more questions in your weak areas.');
  } else {
    recommendations.push('Excellent work! Consider moving to the next HSK level.');
  }

  return { strengths, weaknesses, recommendations, byQuestionType };
};

module.exports = { gradeAnswer, gradeAttempt, buildAnalysis };
