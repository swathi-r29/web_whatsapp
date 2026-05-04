import { useEffect, useState } from 'react';
import { getUsers, getMyGroups } from '../services/api';
import { getSocket } from '../socket';
import CreateGroupModal from './CreateGroupModal';

export default function Sidebar({ currentUser, selectedUser, selectedGroup, onSelectUser, onSelectGroup, onlineUsers, onLogout }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    getUsers().then((all) => setUsers(all.filter((u) => u._id?.toString() !== currentUser._id?.toString())));
    getMyGroups().then(setGroups);

    const socket = getSocket(currentUser._id);

    const messageHandler = (msg) => {
      setUsers((prev) => {
        const updated = [...prev];
        const meId = currentUser._id?.toString();
        const msgSender = msg.senderId?.toString?.() || msg.senderId;
        const msgReceiver = msg.receiverId?.toString?.() || msg.receiverId;
        const otherId = msgSender === meId ? msgReceiver : msgSender;
        const index = updated.findIndex((u) => u._id?.toString() === otherId);
        if (index !== -1) {
          const userToUpdate = { ...updated[index], lastMessage: msg };
          updated.splice(index, 1);
          updated.unshift(userToUpdate);
        }
        return updated;
      });
    };

    const groupMessageHandler = (msg) => {
      setGroups((prev) => {
        const updated = [...prev];
        const index = updated.findIndex(g => g._id?.toString() === msg.groupId?.toString());
        if (index !== -1) {
          const userToUpdate = { ...updated[index], lastMessage: msg };
          updated.splice(index, 1);
          updated.unshift(userToUpdate);
        }
        return updated;
      });
    };

    const reactionHandler = (updatedMsg) => {
      if (updatedMsg.groupId) {
        setGroups(prev => prev.map(g => g._id === updatedMsg.groupId && g.lastMessage?._id === updatedMsg._id ? { ...g, lastMessage: updatedMsg } : g));
      } else {
        setUsers(prev => prev.map(u => u.lastMessage?._id === updatedMsg._id ? { ...u, lastMessage: updatedMsg } : u));
      }
    };

    const seenByMeHandler = ({ senderId }) => {
      setUsers(prev => prev.map(u => 
        u._id?.toString() === senderId?.toString() 
          ? { ...u, lastMessage: u.lastMessage ? { ...u.lastMessage, status: 'seen' } : null } 
          : u
      ));
    };

    const deliveredHandler = ({ receiverId }) => {
      setUsers(prev => prev.map(u => 
        u._id?.toString() === receiverId?.toString() && u.lastMessage?.status === 'sent'
          ? { ...u, lastMessage: { ...u.lastMessage, status: 'delivered' } }
          : u
      ));
    };

    const seenHandler = ({ receiverId }) => {
      setUsers(prev => prev.map(u => 
        u._id?.toString() === receiverId?.toString() && u.lastMessage?.status !== 'seen'
          ? { ...u, lastMessage: { ...u.lastMessage, status: 'seen' } }
          : u
      ));
    };

    socket.on('newMessage', messageHandler);
    socket.on('newGroupMessage', groupMessageHandler);
    socket.on('reactionUpdated', reactionHandler);
    socket.on('messagesSeenByMe', seenByMeHandler);
    socket.on('messagesDelivered', deliveredHandler);
    socket.on('messagesSeen', seenHandler);

    return () => {
      socket.off('newMessage', messageHandler);
      socket.off('newGroupMessage', groupMessageHandler);
      socket.off('reactionUpdated', reactionHandler);
      socket.off('messagesSeenByMe', seenByMeHandler);
      socket.off('messagesDelivered', deliveredHandler);
      socket.off('messagesSeen', seenHandler);
    };
  }, [currentUser._id]);

  const handleGroupCreated = (group) => {
    setGroups(prev => [group, ...prev]);
    onSelectGroup(group);
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const avatar = (name) => name[0].toUpperCase();
  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`sidebar ${(selectedUser || selectedGroup) ? 'hidden-on-mobile' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-user">
          <div className="avatar avatar-green">{avatar(currentUser.username)}</div>
          <span className="sidebar-username">{currentUser.username}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="new-group-btn" onClick={() => setShowGroupModal(true)} title="New Group">
            <div className="new-chat-icon">
              <span className="plus">+</span>
            </div>
          </button>
          <button className="logout-btn" onClick={onLogout} title="Logout">⏻</button>
        </div>
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
        {/* Groups Section */}
        {filteredGroups.length > 0 && (
          <>
            <p className="sidebar-section-label">Groups</p>
            {filteredGroups.map((g) => (
              <div
                key={g._id}
                className={`sidebar-item ${selectedGroup?._id === g._id ? 'active' : ''}`}
                onClick={() => onSelectGroup(g)}
              >
                <div className="avatar-wrapper">
                  <div className="avatar avatar-purple">{avatar(g.name)}</div>
                </div>
                <div className="sidebar-item-info">
                  <div className="sidebar-item-header">
                    <span className="sidebar-item-name">{g.name}</span>
                    {g.lastMessage && (
                      <span className="sidebar-item-time">{formatTime(g.lastMessage.createdAt)}</span>
                    )}
                  </div>
                  <div className="sidebar-item-footer">
                    <span className="sidebar-item-status">
                      {g.lastMessage
                        ? `${g.lastMessage.senderId?.username || 'Someone'}: ${g.lastMessage.text || '📎 Media'}`
                        : `${g.members?.length || 0} members`}
                    </span>
                    {g.lastMessage && (g.lastMessage.senderId?._id || g.lastMessage.senderId)?.toString() !== currentUser._id?.toString() && selectedGroup?._id?.toString() !== g._id?.toString() && (
                      <span className="unread-badge">1</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <p className="sidebar-section-label">Direct Messages</p>
          </>
        )}

        {/* Users Section */}
        {filteredUsers.length === 0 && filteredGroups.length === 0 && (
          <p className="no-users">No chats found</p>
        )}
        {filteredUsers.map((u) => (
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
                  {u.lastMessage && (u.lastMessage.senderId?._id || u.lastMessage.senderId)?.toString() === currentUser._id?.toString() && (
                    <span className={`sidebar-tick ${u.lastMessage.status === 'seen' ? 'seen' : ''}`}>
                      {u.lastMessage.status === 'sent' ? '✓ ' : '✓✓ '}
                    </span>
                  )}
                  {u.lastMessage ? (u.lastMessage.text || '📎 Media') : (onlineUsers.includes(u._id) ? 'online' : 'offline')}
                </span>
                  {u.lastMessage && (u.lastMessage.senderId?._id || u.lastMessage.senderId)?.toString() !== currentUser._id?.toString() && u.lastMessage.status !== 'seen' && selectedUser?._id?.toString() !== u._id?.toString() && (
                    <span className="unread-badge">1</span>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showGroupModal && (
        <CreateGroupModal
          currentUser={currentUser}
          allUsers={users}
          onGroupCreated={handleGroupCreated}
          onClose={() => setShowGroupModal(false)}
        />
      )}
    </div>
  );
}
