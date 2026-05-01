const router = require('express').Router();
const { createUser, loginUser, getUsers } = require('../controllers/userController');

router.post('/create', createUser);
router.post('/login', loginUser);
router.get('/', getUsers);

module.exports = router;
