import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import ChatPage from './pages/ChatPage';
import { disconnectSocket } from './socket';

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('wa_user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (userData) => {
    localStorage.setItem('wa_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    disconnectSocket();
    localStorage.removeItem('wa_user');
    setUser(null);
  };

  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/chat" replace /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/chat"
          element={user ? <ChatPage user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />}
        />
      </Routes>
    </>
  );
}
