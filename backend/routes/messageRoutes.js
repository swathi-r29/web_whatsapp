const router = require('express').Router();
const { sendMessage, getMessages, uploadMedia, sendGroupMessage, getGroupMessages } = require('../controllers/messageController');
const upload = require('../config/multer');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/send', sendMessage);
router.post('/group/send', sendGroupMessage);
router.get('/group/:groupId', getGroupMessages);
router.get('/:senderId/:receiverId', getMessages);

// Use multer for single file upload. Catch multer errors gracefully.
router.post('/upload', (req, res, next) => {
  upload.single('media')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, uploadMedia);

module.exports = router;
