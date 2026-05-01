import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { loginUser, createUser, getUsers } from '../services/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [existingUsers, setExistingUsers] = useState([]);

  useEffect(() => {
    getUsers().then(users => setExistingUsers(users.slice(0, 5))).catch(console.error);
  }, []);

  const handle = async (action) => {
    if (!username.trim()) return setError('Enter a username');
    setError('');
    setLoading(true);
    try {
      const fn   = action === 'login' ? loginUser : createUser;
      const user = await fn(username.trim());
      toast.success(`Welcome, ${user.username}!`);
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <div className="login-logo">
          <span className="login-icon">💬</span>
          <h1>WhatsApp</h1>
          <p>Enter your username to continue</p>
        </div>
        <input
          className="login-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handle('login')}
          autoFocus
        />
        {error && <p className="login-error">{error}</p>}
        <div className="login-actions">
          <button className="btn-primary" onClick={() => handle('login')} disabled={loading}>
            {loading ? '...' : 'Log In'}
          </button>
          <button className="btn-secondary" onClick={() => handle('create')} disabled={loading}>
            {loading ? '...' : 'Create Account'}
          </button>
        </div>

      </div>
    </div>
  );
}
