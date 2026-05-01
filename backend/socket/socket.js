const { Server } = require('socket.io');
const User = require('../models/User');
const Message = require('../models/Message');

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

      try {
        const unread = await Message.find({ receiverId: userId, status: 'sent' });
        if (unread.length > 0) {
          await Message.updateMany({ receiverId: userId, status: 'sent' }, { status: 'delivered' });
          const senders = [...new Set(unread.map(m => m.senderId.toString()))];
          senders.forEach(senderId => {
            const senderSocket = userSocketMap[senderId];
            if (senderSocket) io.to(senderSocket).emit('messagesDelivered', { receiverId: userId });
          });
        }
      } catch (err) {
        console.error('Error updating delivered status:', err);
      }
    }

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

    socket.on('markAsSeen', async ({ senderId }) => {
      if (!userId || !senderId) return;
      try {
        await Message.updateMany(
          { senderId, receiverId: userId, status: { $ne: 'seen' } },
          { status: 'seen' }
        );
        const senderSocket = userSocketMap[senderId];
        if (senderSocket) {
          io.to(senderSocket).emit('messagesSeen', { receiverId: userId });
        }
      } catch (err) {
        console.error('Error marking as seen:', err);
      }
    });
  });
};

const getIO = () => io;
const getSocketId = (userId) => userSocketMap[userId];

module.exports = initSocket;
module.exports.getIO = getIO;
module.exports.getSocketId = getSocketId;
