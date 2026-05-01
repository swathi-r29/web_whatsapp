const User = require('../models/User');

exports.createUser = async (req, res) => {
  const { username } = req.body;
  if (!username?.trim()) return res.status(400).json({ error: 'Username is required' });
  try {
    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Username already taken' });
    const user = await User.create({ username: username.trim() });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { username } = req.body;
  if (!username?.trim()) return res.status(400).json({ error: 'Username is required' });
  try {
    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  const { currentUserId } = req.query;
  try {
    const users = await User.find().sort({ createdAt: 1 }).lean();
    
    if (!currentUserId) {
      return res.json(users);
    }

    const Message = require('../models/Message');
    
    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
    }).sort({ createdAt: -1 }).lean();

    // Group messages to find the latest for each contact
    const lastMessages = {};
    for (const msg of messages) {
      const otherUserId = msg.senderId.toString() === currentUserId ? msg.receiverId.toString() : msg.senderId.toString();
      if (!lastMessages[otherUserId]) {
        lastMessages[otherUserId] = msg;
      }
    }

    const usersWithLastMessage = users.map(u => ({
      ...u,
      lastMessage: lastMessages[u._id.toString()] || null
    }));

    res.json(usersWithLastMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
