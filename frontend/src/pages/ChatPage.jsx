import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { getSocket } from '../socket';

export default function ChatPage({ user, onLogout }) {
  const [selectedUser, setSelectedUser]   = useState(null);
  const [onlineUsers, setOnlineUsers]     = useState([]);

  useEffect(() => {
    const socket = getSocket(user._id);
    socket.on('onlineUsers', setOnlineUsers);
    socket.emit('requestOnlineUsers');
    return () => socket.off('onlineUsers', setOnlineUsers);
  }, [user._id]);

  return (
    <div className="app-container">
      <Sidebar
        currentUser={user}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        onlineUsers={onlineUsers}
        onLogout={onLogout}
      />
      <ChatWindow 
        currentUser={user} 
        selectedUser={selectedUser} 
        onlineUsers={onlineUsers} 
        onCloseChat={() => setSelectedUser(null)} 
      />
    </div>
  );
}
