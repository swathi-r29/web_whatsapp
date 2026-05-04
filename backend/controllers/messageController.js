const Message = require('../models/Message');
const Group = require('../models/Group');
const { getIO, getSocketId } = require('../socket/socket');

exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, text, mediaUrl, mediaType } = req.body;
  if (!senderId || !receiverId) return res.status(400).json({ error: 'senderId and receiverId required' });
  if (!text?.trim() && !mediaUrl) return res.status(400).json({ error: 'Message cannot be empty' });
  try {
    const message = await Message.create({ 
      senderId, 
      receiverId, 
      text: text?.trim(), 
      mediaUrl,
      mediaType,
      status: getSocketId(receiverId) ? 'delivered' : 'sent'
    });

    const io = getIO();
    io.to(receiverId.toString()).emit('newMessage', message);
    io.to(senderId.toString()).emit('newMessage', message);
    
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

exports.sendGroupMessage = async (req, res) => {
  const { groupId, text, mediaUrl, mediaType } = req.body;
  const senderId = req.user._id;

  if (!groupId) return res.status(400).json({ error: 'groupId is required' });
  if (!text?.trim() && !mediaUrl) return res.status(400).json({ error: 'Message cannot be empty' });

  try {
    // 🔐 Security: verify sender is a group member
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    const isMember = group.members.some(m => m.toString() === senderId.toString());
    if (!isMember) return res.status(403).json({ error: 'You are not a member of this group' });

    const message = await Message.create({
      senderId,
      groupId,
      text: text?.trim(),
      mediaUrl,
      mediaType,
    });

    // Populate senderId so the frontend has the username for display
    const populated = await message.populate('senderId', 'username');

    // Broadcast to everyone in the room (including sender for consistency)
    getIO().to(groupId.toString()).emit('newGroupMessage', populated);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGroupMessages = async (req, res) => {
  const { groupId } = req.params;
  try {
    // 🔐 Security: verify requester is a member
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ error: 'You are not a member of this group' });

    const messages = await Message.find({ groupId })
      .populate('senderId', 'username')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    const mediaType = req.file.mimetype.startsWith('video/') 
      ? 'video' 
      : req.file.mimetype.startsWith('audio/') 
        ? 'audio' 
        : 'image';
    res.status(200).json({ mediaUrl: fileUrl, mediaType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
