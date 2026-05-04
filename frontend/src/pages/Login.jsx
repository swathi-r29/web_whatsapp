import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { loginUser, createUser, getUsers } from '../services/api';

export default function Login({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setError('');
    setLoading(true);
    try {
      let user;
      if (isLoginMode) {
        if (!identifier.trim()) throw new Error('Enter username or email');
        user = await loginUser(identifier.trim());
      } else {
        if (!username.trim() || !email.trim()) throw new Error('Enter both username and email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) throw new Error('Please enter a valid email address');
        user = await createUser(username.trim(), email.trim());
      }
      toast.success(`Welcome, ${user.username}!`);
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
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
          <p>{isLoginMode ? 'Log in to your account' : 'Create a new account'}</p>
        </div>

        {isLoginMode ? (
          <input
            className="login-input"
            type="text"
            placeholder="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAction()}
            autoFocus
          />
        ) : (
          <>
            <input
              className="login-input"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              style={{ marginBottom: '10px' }}
            />
            <input
              className="login-input"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAction()}
            />
          </>
        )}

        {error && <p className="login-error">{error}</p>}

        <div className="login-actions">
          <button className="btn-primary" onClick={handleAction} disabled={loading}>
            {loading ? '...' : (isLoginMode ? 'Log In' : 'Sign Up')}
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
            }}
            disabled={loading}
          >
            {isLoginMode ? 'Create Account' : 'Back to Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
