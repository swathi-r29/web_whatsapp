import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { logoutUser, getMe } from './services/api';
import { disconnectSocket } from './socket';
import Login from './pages/Login';
import ChatPage from './pages/ChatPage';

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('wa_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    // Only verify session if there's a stored user — avoids noisy 401 on login page
    const stored = localStorage.getItem('wa_user');
    if (!stored) return;

    getMe()
      .then(userData => {
        setUser(userData);
        localStorage.setItem('wa_user', JSON.stringify(userData));
      })
      .catch(() => {
        // Token expired or invalid — clear and redirect to login
        setUser(null);
        localStorage.removeItem('wa_user');
      });
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('wa_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout failed', err);
    }
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
