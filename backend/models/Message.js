const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },   // DM only
  groupId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },  // Group only
  text:       { type: String, trim: true },
  mediaUrl:   { type: String },
  mediaType:  { type: String, enum: ['image', 'video', 'audio'] },
  status:     { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
  reactions:  { type: [reactionSchema], default: [] }
}, { timestamps: true });

// Index for fast group message queries
messageSchema.index({ groupId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
