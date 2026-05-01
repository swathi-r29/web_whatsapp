const Message = require('../models/Message');
const { getIO, getSocketId } = require('../socket/socket');

exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, text } = req.body;
  if (!senderId || !receiverId) return res.status(400).json({ error: 'senderId and receiverId required' });
  if (!text?.trim()) return res.status(400).json({ error: 'Message text cannot be empty' });
  try {
    const socketId = getSocketId(receiverId);
    const status = socketId ? 'delivered' : 'sent';
    const message = await Message.create({ senderId, receiverId, text: text.trim(), status });
    
    if (socketId) getIO().to(socketId).emit('newMessage', message);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  const { senderId, receiverId } = req.params;
  if (!senderId || !receiverId) return res.status(400).json({ error: 'Both user IDs required' });
  try {
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
