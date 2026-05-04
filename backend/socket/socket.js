const { Server } = require('socket.io');
const User = require('../models/User');
const Message = require('../models/Message');
const Group = require('../models/Group');

let io;
const userSocketMap = {};

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] },
  });

  io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap[userId] = socket.id;
      socket.join(userId.toString()); // JOIN PRIVATE ROOM FOR SYNC

      try {
        // Mark as delivered for all messages sent to this user
        await Message.updateMany({ receiverId: userId, status: 'sent' }, { status: 'delivered' });

        // Notify senders that their messages were delivered
        const pendingSenders = await Message.distinct('senderId', { receiverId: userId, status: 'delivered' });
        pendingSenders.forEach(senderId => {
          const senderSocket = userSocketMap[senderId];
          if (senderSocket) {
            io.to(senderSocket).emit('messagesDelivered', { receiverId: userId });
          }
        });

        // Notify others that user is online
        socket.broadcast.emit('userOnline', userId);
      } catch (err) {
        console.error('Error updating delivered status:', err);
      }
    }

    // Auto-join all group rooms the user is a member of
    try {
      const myGroups = await Group.find({ members: userId }, '_id');
      myGroups.forEach(g => socket.join(g._id.toString()));
    } catch (err) {
      console.error('Error joining group rooms:', err);
    }

    // Allow joining a newly created group room dynamically
    socket.on('joinGroup', (groupId) => {
      socket.join(groupId);
    });

    io.emit('onlineUsers', Object.keys(userSocketMap));

    socket.on('disconnect', async () => {
      if (userId) {
        delete userSocketMap[userId];
        try {
          await User.findByIdAndUpdate(userId, { lastSeen: Date.now() });
        } catch (err) {
          console.error('Error updating lastSeen:', err);
        }
      }
      io.emit('onlineUsers', Object.keys(userSocketMap));
    });

    socket.on('requestOnlineUsers', () => {
      socket.emit('onlineUsers', Object.keys(userSocketMap));
    });

    socket.on('typing', ({ receiverId }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', { senderId: userId });
      }
    });

    socket.on('stopTyping', ({ receiverId }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('stopTyping', { senderId: userId });
      }
    });

    // Group typing (throttled on frontend — just broadcast who is typing)
    socket.on('groupTyping', ({ groupId }) => {
      socket.to(groupId).emit('groupTyping', { senderId: userId, groupId });
    });

    socket.on('stopGroupTyping', ({ groupId }) => {
      socket.to(groupId).emit('stopGroupTyping', { senderId: userId, groupId });
    });

    socket.on('markAsSeen', async ({ senderId }) => {
      if (!userId || !senderId) return;
      try {
        await Message.updateMany(
          { senderId, receiverId: userId, status: { $ne: 'seen' } },
          { status: 'seen' }
        );
        // Notify sender that their messages were seen (turns ticks blue)
        const senderSocket = userSocketMap[senderId];
        if (senderSocket) {
          io.to(senderSocket).emit('messagesSeen', { receiverId: userId });
        }

        // Notify receiver (all tabs) that messages from this sender are now seen (clears badges)
        io.to(userId.toString()).emit('messagesSeenByMe', { senderId });
      } catch (err) {
        console.error('Error marking as seen:', err);
      }
    });

    socket.on('addReaction', async ({ messageId, emoji, receiverId }) => {
      if (!userId) return;
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingReaction = message.reactions.find(
          r => r.userId.toString() === userId
        );

        if (existingReaction) {
          if (existingReaction.emoji === emoji) {
            // Toggle off
            message.reactions = message.reactions.filter(
              r => r.userId.toString() !== userId
            );
          } else {
            // Replace emoji
            existingReaction.emoji = emoji;
          }
        } else {
          // Add new reaction
          message.reactions.push({ userId, emoji });
        }

        await message.save();

        if (message.groupId) {
          io.to(message.groupId.toString()).emit('reactionUpdated', message);
        } else if (receiverId) {
          const senderSocket = userSocketMap[userId];
          const receiverSocket = userSocketMap[receiverId];
          if (senderSocket) io.to(senderSocket).emit('reactionUpdated', message);
          if (receiverSocket) io.to(receiverSocket).emit('reactionUpdated', message);
        }
      } catch (err) {
        console.error('Error adding reaction:', err);
      }
    });
  });
};

const getIO = () => io;
const getSocketId = (userId) => userSocketMap[userId];

module.exports = initSocket;
module.exports.getIO = getIO;
module.exports.getSocketId = getSocketId;
