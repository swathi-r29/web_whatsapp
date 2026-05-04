const router = require('express').Router();
const { createUser, loginUser, getUsers, logoutUser, getMe } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', createUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.get('/', protect, getUsers);

module.exports = router;
