const router = require('express').Router();
const { listUsers, updateUser, deleteUser } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorize('admin', 'superadmin'));

router.get('/', listUsers);
router.put('/:userId', updateUser);
router.delete('/:userId', deleteUser);

module.exports = router;
