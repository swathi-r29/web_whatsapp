import { useEffect, useState } from 'react';
import { getUsers } from '../services/api';
import { getSocket } from '../socket';

export default function Sidebar({ currentUser, selectedUser, onSelectUser, onlineUsers, onLogout }) {
  const [users, setUsers]     = useState([]);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    getUsers(currentUser._id).then((all) => setUsers(all.filter((u) => u._id !== currentUser._id)));
    
    const socket = getSocket(currentUser._id);
    const messageHandler = (msg) => {
      setUsers((prev) => {
        const updated = [...prev];
        const otherId = msg.senderId === currentUser._id ? msg.receiverId : msg.senderId;
        const index = updated.findIndex((u) => u._id === otherId);
        if (index !== -1) {
          const userToUpdate = updated[index];
          userToUpdate.lastMessage = msg;
          // Move to top
          updated.splice(index, 1);
          updated.unshift(userToUpdate);
        }
        return updated;
      });
    };
    
    socket.on('newMessage', messageHandler);
    return () => socket.off('newMessage', messageHandler);
  }, [currentUser._id]);

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    (u.lastMessage?.text || '').toLowerCase().includes(search.toLowerCase())
  );

  const avatar = (name) => name[0].toUpperCase();

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`sidebar ${selectedUser ? 'hidden-on-mobile' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-user">
          <div className="avatar avatar-green">{avatar(currentUser.username)}</div>
          <span className="sidebar-username">{currentUser.username}</span>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Logout">⏻</button>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search or start new chat"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="sidebar-list">
        {filtered.length === 0 && (
          <p className="no-users">No users found</p>
        )}
        {filtered.map((u) => (
          <div
            key={u._id}
            className={`sidebar-item ${selectedUser?._id === u._id ? 'active' : ''}`}
            onClick={() => onSelectUser(u)}
          >
            <div className="avatar-wrapper">
              <div className="avatar">{avatar(u.username)}</div>
              {onlineUsers.includes(u._id) && <span className="online-dot" />}
            </div>
            <div className="sidebar-item-info">
              <div className="sidebar-item-header">
                <span className="sidebar-item-name">{u.username}</span>
                {u.lastMessage && (
                  <span className="sidebar-item-time">{formatTime(u.lastMessage.createdAt)}</span>
                )}
              </div>
              <div className="sidebar-item-footer">
                <span className="sidebar-item-status">
                  {u.lastMessage ? u.lastMessage.text : (onlineUsers.includes(u._id) ? 'online' : 'offline')}
                </span>
                {u.lastMessage && u.lastMessage.senderId !== currentUser._id && u.lastMessage.status !== 'seen' && selectedUser?._id !== u._id && (
                  <span className="unread-badge">1</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
