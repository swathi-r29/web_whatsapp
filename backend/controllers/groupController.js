const Group = require('../models/Group');
const Message = require('../models/Message');
const { getIO } = require('../socket/socket');

exports.createGroup = async (req, res) => {
  const { name, members } = req.body;
  const creatorId = req.user._id.toString();

  if (!name?.trim()) return res.status(400).json({ error: 'Group name is required' });
  if (!members || !Array.isArray(members) || members.length < 1) {
    return res.status(400).json({ error: 'Group must have at least 2 members (including you)' });
  }

  try {
    // Ensure creator is included and no duplicates
    const uniqueMembers = [...new Set([creatorId, ...members.map(m => m.toString())])];

    if (uniqueMembers.length < 2) {
      return res.status(400).json({ error: 'Group must have at least 2 members' });
    }

    const group = await Group.create({
      name: name.trim(),
      creator: creatorId,
      members: uniqueMembers,
    });

    const populated = await group.populate('members', 'username email');

    // Notify all members via socket to join the new room
    const io = getIO();
    populated.members.forEach(member => {
      io.to(member._id.toString()).emit('joinGroup', group._id.toString());
    });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'username email');
    
    const groupsWithLastMsg = await Promise.all(groups.map(async (g) => {
      const lastMsg = await Message.findOne({ groupId: g._id })
        .populate('senderId', 'username')
        .sort({ createdAt: -1 });
      return { ...g._doc, lastMessage: lastMsg };
    }));

    // Sort by last message date
    groupsWithLastMsg.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
      return dateB - dateA;
    });

    res.json(groupsWithLastMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
