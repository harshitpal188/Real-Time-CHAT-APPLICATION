import React, { useState, useCallback } from 'react';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const validateUsername = useCallback((name) => {
    if (!name) {
      return 'Username is required';
    }
    if (name.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (name.length > 20) {
      return 'Username must be less than 20 characters';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    return '';
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const validationError = validateUsername(username);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    onLogin(username);
  }, [username, onLogin, validateUsername]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setUsername(value);
    if (error) {
      setError(validateUsername(value));
    }
  }, [error, validateUsername]);

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Welcome to Chat App</h2>
        <p>Please enter a username to continue</p>
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={handleChange}
            placeholder="Enter your username"
            aria-label="Username"
            aria-invalid={!!error}
            aria-describedby={error ? "username-error" : undefined}
            autoComplete="username"
            autoFocus
          />
          {error && (
            <span id="username-error" className="error-message" role="alert">
              {error}
            </span>
          )}
        </div>

        <button 
          type="submit" 
          disabled={!username.trim() || !!error}
          className="login-button"
        >
          Join Chat
        </button>
      </form>
    </div>
  );
}

export default LoginForm; 