const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax', 
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

exports.createUser = async (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) return res.status(400).json({ error: 'Username and email are required' });
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ 
        error: existingUser.username === username ? 'Username already taken' : 'Email already registered' 
      });
    }
    const user = await User.create({ username, email });
    generateTokenAndSetCookie(res, user._id);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ error: 'Username or email required' });
  try {
    const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    if (!user) return res.status(404).json({ error: 'User not found' });
    generateTokenAndSetCookie(res, user._id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const Message = require('../models/Message');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }, 'username email lastSeen');
    
    // For each user, find the last message with the current user
    const usersWithLastMsg = await Promise.all(users.map(async (userDoc) => {
      const u = userDoc.toObject();
      const lastMsg = await Message.findOne({
        $or: [
          { senderId: req.user._id, receiverId: u._id },
          { senderId: u._id, receiverId: req.user._id }
        ]
      }).sort({ createdAt: -1 });
      
      return { ...u, lastMessage: lastMsg };
    }));

    // Sort by last message date (most recent first)
    usersWithLastMsg.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
      return dateB - dateA;
    });

    res.json(usersWithLastMsg);
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
