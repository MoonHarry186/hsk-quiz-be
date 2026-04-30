const HSK_LEVELS = [1, 2, 3, 4, 5, 6];

const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  FILL_BLANK: 'fill_blank',
  ESSAY: 'essay',
};

const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  TEACHER: 'teacher',
};

const ATTEMPT_STATUS = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
};

const DEFAULT_PASSING_SCORE = 70;
const DEFAULT_DURATION = 30;

module.exports = {
  HSK_LEVELS,
  QUESTION_TYPES,
  USER_ROLES,
  ATTEMPT_STATUS,
  DEFAULT_PASSING_SCORE,
  DEFAULT_DURATION,
};
