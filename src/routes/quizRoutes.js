const router = require("express").Router();
const {
  listQuizzes,
  generateQuiz,
  createQuiz,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getAttempts,
  getAttempt,
} = require("../controllers/quizController");
const {
  authenticate,
  authorize,
  tryAuthenticate,
} = require("../middleware/authMiddleware");
const {
  validate,
  createQuizSchema,
  generateQuizSchema,
  submitQuizSchema,
} = require("../utils/validators");

router.get("/", tryAuthenticate, listQuizzes);
router.post(
  "/generate",
  authenticate,
  validate(generateQuizSchema),
  generateQuiz,
);
router.post(
  "/",
  authenticate,
  authorize("admin", "teacher"),
  validate(createQuizSchema),
  createQuiz,
);
router.post("/submit", authenticate, validate(submitQuizSchema), submitQuiz);
router.get("/attempts", authenticate, getAttempts);
router.get("/attempts/:attemptId", authenticate, getAttempt);
router.get("/:quizId", tryAuthenticate, getQuiz);
router.put("/:quizId", authenticate, authorize("admin", "teacher"), updateQuiz);
router.delete("/:quizId", authenticate, authorize("admin"), deleteQuiz);

module.exports = router;
