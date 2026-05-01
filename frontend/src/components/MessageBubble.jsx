export default function MessageBubble({ message, isSent }) {
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

  return (
    <div className={`bubble-wrapper ${isSent ? 'sent' : 'received'}`}>
      <div className={`bubble ${isSent ? 'bubble-sent' : 'bubble-received'}`}>
        <p className="bubble-text">{message.text}</p>
        <span className="bubble-time">
          {formatTime(message.createdAt)}
          {renderStatus()}
        </span>
      </div>
    </div>
  );
}
