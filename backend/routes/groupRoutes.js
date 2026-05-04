const router = require('express').Router();
const { createGroup, getMyGroups } = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createGroup);
router.get('/', getMyGroups);

module.exports = router;
