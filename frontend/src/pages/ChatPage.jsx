import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { getSocket } from '../socket';

export default function ChatPage({ user, onLogout }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const socket = getSocket(user._id);
    socket.on('onlineUsers', setOnlineUsers);
    socket.emit('requestOnlineUsers');
    return () => socket.off('onlineUsers', setOnlineUsers);
  }, [user._id]);

  // Mutual exclusion: selecting a user clears group and vice versa
  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setSelectedGroup(null);
  };

  const handleSelectGroup = (g) => {
    setSelectedGroup(g);
    setSelectedUser(null);
  };

  const handleCloseChat = () => {
    setSelectedUser(null);
    setSelectedGroup(null);
  };

  return (
    <div className="app-container">
      <Sidebar
        currentUser={user}
        selectedUser={selectedUser}
        selectedGroup={selectedGroup}
        onSelectUser={handleSelectUser}
        onSelectGroup={handleSelectGroup}
        onlineUsers={onlineUsers}
        onLogout={onLogout}
      />
      <ChatWindow
        currentUser={user}
        selectedUser={selectedUser}
        selectedGroup={selectedGroup}
        onlineUsers={onlineUsers}
        onCloseChat={handleCloseChat}
      />
    </div>
  );
}
