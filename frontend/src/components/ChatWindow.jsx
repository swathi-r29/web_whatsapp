import { useEffect, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import MessageBubble from './MessageBubble';
import { getMessages, sendMessage, uploadMedia, getGroupMessages, sendGroupMessage } from '../services/api';
import { getSocket } from '../socket';
import VoiceRecorder from './VoiceRecorder';

export default function ChatWindow({ currentUser, selectedUser, selectedGroup, onlineUsers, onCloseChat }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [groupTypingUsers, setGroupTypingUsers] = useState([]);
  const [showEmoji, setShowEmoji]= useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const bottomRef               = useRef(null);
  const fileInputRef            = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const typingTimeoutRef        = useRef(null);

  const isGroupChat = !!selectedGroup;
  const activeChat  = selectedGroup || selectedUser;

  useEffect(() => {
    if (!activeChat) return;
    setMessages([]);
    setIsTyping(false);
    setGroupTypingUsers([]);

    const socket = getSocket(currentUser._id);

    if (isGroupChat) {
      // Group chat mode
      getGroupMessages(selectedGroup._id).then(setMessages);

      const groupMsgHandler = (msg) => {
        if (msg.groupId?.toString() === selectedGroup._id?.toString()) {
          setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
        }
      };

      const groupTypingHandler = ({ senderId, groupId }) => {
        if (groupId?.toString() === selectedGroup._id?.toString() && senderId !== currentUser._id) {
          setGroupTypingUsers(prev => prev.includes(senderId) ? prev : [...prev, senderId]);
        }
      };

      const stopGroupTypingHandler = ({ senderId, groupId }) => {
        if (groupId?.toString() === selectedGroup._id?.toString()) {
          setGroupTypingUsers(prev => prev.filter(id => id !== senderId));
        }
      };

      const reactionHandler = (updatedMessage) => {
        if (updatedMessage.groupId?.toString() === selectedGroup._id?.toString()) {
          setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
        }
      };

      socket.on('newGroupMessage', groupMsgHandler);
      socket.on('groupTyping', groupTypingHandler);
      socket.on('stopGroupTyping', stopGroupTypingHandler);
      socket.on('reactionUpdated', reactionHandler);

      return () => {
        socket.off('newGroupMessage', groupMsgHandler);
        socket.off('groupTyping', groupTypingHandler);
        socket.off('stopGroupTyping', stopGroupTypingHandler);
        socket.off('reactionUpdated', reactionHandler);
      };
    } else {
      // DM mode
      getMessages(currentUser._id, selectedUser._id).then(setMessages);

      const handler = (msg) => {
        const msgSender = msg.senderId?.toString?.() || msg.senderId;
        const msgReceiver = msg.receiverId?.toString?.() || msg.receiverId;
        const meId = currentUser._id?.toString?.() || currentUser._id;
        const themId = selectedUser._id?.toString?.() || selectedUser._id;
        const relevant =
          (msgSender === themId && msgReceiver === meId) ||
          (msgSender === meId && msgReceiver === themId);
        if (relevant) {
          setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
          if (msgSender === themId) setIsTyping(false);
        }
      };

      const typingHandler = ({ senderId }) => {
        if (senderId === selectedUser._id) setIsTyping(true);
      };
      const stopTypingHandler = ({ senderId }) => {
        if (senderId === selectedUser._id) setIsTyping(false);
      };
      const deliveredHandler = ({ receiverId }) => {
        if (receiverId === selectedUser._id) {
          setMessages(prev => prev.map(m =>
            (m.senderId === currentUser._id && m.status === 'sent') ? { ...m, status: 'delivered' } : m
          ));
        }
      };
      const seenHandler = ({ receiverId }) => {
        if (receiverId === selectedUser._id) {
          setMessages(prev => prev.map(m =>
            (m.senderId === currentUser._id && m.status !== 'seen') ? { ...m, status: 'seen' } : m
          ));
        }
      };
      const reactionHandler = (updatedMessage) => {
        setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
      };

      socket.on('newMessage', handler);
      socket.on('typing', typingHandler);
      socket.on('stopTyping', stopTypingHandler);
      socket.on('messagesDelivered', deliveredHandler);
      socket.on('messagesSeen', seenHandler);
      socket.on('reactionUpdated', reactionHandler);
      socket.emit('markAsSeen', { senderId: selectedUser._id });

      return () => {
        socket.off('newMessage', handler);
        socket.off('typing', typingHandler);
        socket.off('stopTyping', stopTypingHandler);
        socket.off('messagesDelivered', deliveredHandler);
        socket.off('messagesSeen', seenHandler);
        socket.off('reactionUpdated', reactionHandler);
      };
    }
  }, [selectedUser, selectedGroup, currentUser._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!isGroupChat && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId === selectedUser?._id && lastMsg.status !== 'seen') {
        getSocket(currentUser._id).emit('markAsSeen', { senderId: selectedUser._id });
      }
    }
  }, [messages, selectedUser?._id, currentUser._id, isGroupChat]);

  const handleSend = async () => {
    if (!text.trim() || !activeChat) return;
    try {
      if (isGroupChat) {
        const msg = await sendGroupMessage({
          groupId: selectedGroup._id,
          text: text.trim(),
        });
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
        getSocket(currentUser._id).emit('stopGroupTyping', { groupId: selectedGroup._id });
      } else {
        const msg = await sendMessage({
          senderId: currentUser._id,
          receiverId: selectedUser._id,
          text: text.trim(),
        });
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
        getSocket(currentUser._id).emit('stopTyping', { receiverId: selectedUser._id });
      }
      setText('');
      setShowEmoji(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Only images and videos are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.');
      return;
    }
    setIsUploading(true);
    try {
      const { mediaUrl, mediaType } = await uploadMedia(file);
      let msg;
      if (isGroupChat) {
        msg = await sendGroupMessage({ groupId: selectedGroup._id, text: text.trim(), mediaUrl, mediaType });
      } else {
        msg = await sendMessage({ senderId: currentUser._id, receiverId: selectedUser._id, text: text.trim(), mediaUrl, mediaType });
      }
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
      setText('');
      setShowEmoji(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to upload media');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    const socket = getSocket(currentUser._id);
    if (isGroupChat) {
      socket.emit('groupTyping', { groupId: selectedGroup._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopGroupTyping', { groupId: selectedGroup._id });
      }, 2000);
    } else {
      socket.emit('typing', { receiverId: selectedUser._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { receiverId: selectedUser._id });
      }, 2000);
    }
  };

  const onEmojiClick = (emojiObj) => {
    setText(prev => prev + emojiObj.emoji);
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `last seen ${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `last seen ${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `last seen ${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval >= 1) return `last seen ${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval >= 1) return `last seen ${Math.floor(interval)} mins ago`;
    return 'last seen just now';
  };

  const getStatusText = () => {
    if (isGroupChat) {
      if (groupTypingUsers.length > 0) return 'typing...';
      return `${selectedGroup.members?.length || 0} members`;
    }
    if (isTyping) return 'typing...';
    return onlineUsers?.includes(selectedUser._id) ? 'online' : formatLastSeen(selectedUser.lastSeen);
  };

  if (!activeChat) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-inner">
          <span className="chat-empty-icon">💬</span>
          <h2>WhatsApp Web</h2>
          <p>Select a contact to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-window ${activeChat ? 'active-on-mobile' : ''}`}>
      <div className="chat-header">
        <button className="back-btn mobile-only" onClick={onCloseChat}>←</button>
        <div className={`avatar ${isGroupChat ? 'avatar-purple' : ''}`}>
          {activeChat.name ? activeChat.name[0].toUpperCase() : activeChat.username[0].toUpperCase()}
        </div>
        <div className="chat-header-info">
          <span className="chat-header-name">{isGroupChat ? selectedGroup.name : selectedUser.username}</span>
          <span className="chat-header-status">{getStatusText()}</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => {
          const senderId = msg.senderId?._id || msg.senderId;
          const isSent = senderId?.toString() === currentUser._id?.toString();
          const senderName = isGroupChat && !isSent
            ? (msg.senderId?.username || '')
            : null;
          return (
            <MessageBubble
              key={msg._id}
              message={msg}
              isSent={isSent}
              senderName={senderName}
              currentUser={currentUser}
              onReact={(messageId, emoji) => {
              getSocket(currentUser._id).emit('addReaction', {
                messageId,
                emoji,
                receiverId: isGroupChat ? null : selectedUser?._id,
                groupId: isGroupChat ? selectedGroup?._id : null
              });
            }}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      {isRecording ? (
        <VoiceRecorder 
          onStop={async (audioFile) => {
            setIsRecording(false);
            setIsUploading(true);
            try {
              const { mediaUrl, mediaType } = await uploadMedia(audioFile);
              let msg;
              if (isGroupChat) {
                msg = await sendGroupMessage({ groupId: selectedGroup._id, mediaUrl, mediaType });
              } else {
                msg = await sendMessage({ senderId: currentUser._id, receiverId: selectedUser._id, mediaUrl, mediaType });
              }
              setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
            } catch (err) {
              console.error(err);
              alert('Failed to send voice note');
            } finally {
              setIsUploading(false);
            }
          }}
          onCancel={() => setIsRecording(false)}
        />
      ) : (
        <div className="chat-input-bar">
          <button className="emoji-btn" onClick={() => setShowEmoji(!showEmoji)}>😊</button>
          <button className="attach-btn" onClick={() => fileInputRef.current?.click()}>📎</button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*,video/*,audio/*"
            onChange={handleFileUpload}
          />
          {showEmoji && (
            <div className="emoji-picker-container">
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
            </div>
          )}
          <textarea
            className="chat-input"
            placeholder={isGroupChat ? `Message ${selectedGroup.name}...` : 'Type a message'}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKey}
            rows={1}
            disabled={isUploading}
          />
          {text.trim() || isUploading ? (
            <button
              className={`send-btn active`}
              onClick={handleSend}
              disabled={isUploading}
            >
              {isUploading ? <span className="upload-spinner">↻</span> : '➤'}
            </button>
          ) : (
            <button className="mic-btn" onClick={() => setIsRecording(true)}>🎤</button>
          )}
        </div>
      )}
    </div>
  );
}
