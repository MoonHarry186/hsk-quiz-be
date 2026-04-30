const router = require('express').Router();
const { register, login, logout, getMe, updateMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, registerSchema, loginSchema, updateProfileSchema } = require('../utils/validators');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, validate(updateProfileSchema), updateMe);

module.exports = router;
