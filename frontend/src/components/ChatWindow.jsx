import { useEffect, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import MessageBubble from './MessageBubble';
import { getMessages, sendMessage } from '../services/api';
import { getSocket } from '../socket';

export default function ChatWindow({ currentUser, selectedUser, onlineUsers, onCloseChat }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji]= useState(false);
  const bottomRef               = useRef(null);
  const typingTimeoutRef        = useRef(null);

  useEffect(() => {
    if (!selectedUser) return;
    getMessages(currentUser._id, selectedUser._id).then(setMessages);

    const socket = getSocket(currentUser._id);
    const handler = (msg) => {
      const relevant =
        (msg.senderId === selectedUser._id && msg.receiverId === currentUser._id) ||
        (msg.senderId === currentUser._id && msg.receiverId === selectedUser._id);
      if (relevant) {
        setMessages((prev) => [...prev, msg]);
        if (msg.senderId === selectedUser._id) setIsTyping(false);
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

    socket.on('newMessage', handler);
    socket.on('typing', typingHandler);
    socket.on('stopTyping', stopTypingHandler);
    socket.on('messagesDelivered', deliveredHandler);
    socket.on('messagesSeen', seenHandler);
    
    // Mark as seen when opening the chat
    socket.emit('markAsSeen', { senderId: selectedUser._id });

    return () => {
      socket.off('newMessage', handler);
      socket.off('typing', typingHandler);
      socket.off('stopTyping', stopTypingHandler);
      socket.off('messagesDelivered', deliveredHandler);
      socket.off('messagesSeen', seenHandler);
    };
  }, [selectedUser, currentUser._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // If we receive a new message from the selected user while the chat is open, mark it as seen
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId === selectedUser?._id && lastMsg.status !== 'seen') {
        getSocket(currentUser._id).emit('markAsSeen', { senderId: selectedUser._id });
      }
    }
  }, [messages, selectedUser?._id, currentUser._id]);

  const handleSend = async () => {
    if (!text.trim() || !selectedUser) return;
    try {
      const msg = await sendMessage({
        senderId: currentUser._id,
        receiverId: selectedUser._id,
        text: text.trim(),
      });
      setMessages((prev) => [...prev, msg]);
      setText('');
      setShowEmoji(false);
      getSocket(currentUser._id).emit('stopTyping', { receiverId: selectedUser._id });
    } catch (err) {
      console.error(err);
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
    socket.emit('typing', { receiverId: selectedUser._id });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { receiverId: selectedUser._id });
    }, 2000);
  };

  const onEmojiClick = (emojiObj) => {
    setText((prev) => prev + emojiObj.emoji);
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

  if (!selectedUser) {
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

  const isOnline = selectedUser ? onlineUsers?.includes(selectedUser._id) : false;

  return (
    <div className={`chat-window ${selectedUser ? 'active-on-mobile' : ''}`}>
      <div className="chat-header">
        <button className="back-btn mobile-only" onClick={onCloseChat}>←</button>
        <div className="avatar">{selectedUser.username[0].toUpperCase()}</div>
        <div className="chat-header-info">
          <span className="chat-header-name">{selectedUser.username}</span>
          <span className="chat-header-status">
            {isTyping ? 'typing...' : (isOnline ? 'online' : formatLastSeen(selectedUser.lastSeen))}
          </span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isSent={msg.senderId === currentUser._id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <button className="emoji-btn" onClick={() => setShowEmoji(!showEmoji)}>😊</button>
        {showEmoji && (
          <div className="emoji-picker-container">
            <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
          </div>
        )}
        <textarea
          className="chat-input"
          placeholder="Type a message"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKey}
          rows={1}
        />
        <button
          className={`send-btn ${text.trim() ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!text.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
