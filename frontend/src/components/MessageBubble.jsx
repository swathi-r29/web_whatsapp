import { useState, useRef } from 'react';

const PREDEFINED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({ message, isSent, senderName, currentUser, onReact }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const hideTimeoutRef = useRef(null);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? timeStr : `${date.toLocaleDateString()} ${timeStr}`;
  };

  const renderStatus = () => {
    if (!isSent) return null;
    if (message.status === 'seen') return <span className="message-status seen">✓✓</span>;
    if (message.status === 'delivered') return <span className="message-status">✓✓</span>;
    return <span className="message-status">✓</span>;
  };

  const reactionCounts = message.reactions?.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {}) || {};

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowPicker(false);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    hideTimeoutRef.current = setTimeout(() => {
      setShowPicker(false);
    }, 500); // 500ms grace period
  };

  return (
    <div 
      className={`bubble-wrapper ${isSent ? 'sent' : 'received'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Reaction Toggle Button */}
      {!isSent && isHovered && !showPicker && (
        <button className="reaction-toggle-btn received-btn" onClick={() => setShowPicker(true)}>☺</button>
      )}

      <div className={`bubble ${isSent ? 'bubble-sent' : 'bubble-received'} ${message.mediaUrl ? 'bubble-has-media' : ''}`}>
        {senderName && <p className="group-sender-name">{senderName}</p>}
        {message.mediaUrl && (
          <div className="bubble-media-container">
            {message.mediaType === 'image' ? (
              <img 
                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${message.mediaUrl}`} 
                alt="Uploaded media" 
                className="message-media" 
              />
            ) : message.mediaType === 'video' ? (
              <video 
                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${message.mediaUrl}`} 
                controls 
                className="message-media" 
              />
            ) : (
              <div className="audio-player-container">
                <audio 
                  src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${message.mediaUrl}`} 
                  controls 
                  className="message-audio" 
                />
              </div>
            )}
          </div>
        )}
        <div className="bubble-meta">
          {message.text && <p className="bubble-text">{message.text}</p>}
          <span className="bubble-time">
            {formatTime(message.createdAt)}
            {renderStatus()}
          </span>
        </div>

        {/* Active Reactions */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="active-reactions">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <span key={emoji} className="reaction-badge">
                {emoji} {count > 1 ? count : ''}
              </span>
            ))}
          </div>
        )}

        {/* Reaction Picker */}
        {showPicker && (
          <div className="reaction-picker">
            {PREDEFINED_EMOJIS.map(emoji => {
              const hasReacted = message.reactions?.some(r => r.userId === currentUser._id && r.emoji === emoji);
              return (
                <button 
                  key={emoji} 
                  className={`reaction-picker-btn ${hasReacted ? 'active-reaction' : ''}`}
                  onClick={() => handleReact(emoji)}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isSent && isHovered && !showPicker && (
        <button className="reaction-toggle-btn sent-btn" onClick={() => setShowPicker(true)}>☺</button>
      )}
    </div>
  );
}
