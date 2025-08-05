import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import LoginForm from './components/LoginForm';
import ChatRoom from './components/ChatRoom';
import './App.css';

function App() {
  const [username, setUsername] = useState(() => {
    const savedUsername = sessionStorage.getItem('chatUsername');
    return savedUsername || '';
  });

  useEffect(() => {
    if (username) {
      sessionStorage.setItem('chatUsername', username);
    } else {
      sessionStorage.removeItem('chatUsername');
    }
  }, [username]);

  const handleLogin = (name) => {
    setUsername(name);
  };

  const handleLogout = () => {
    setUsername('');
  };

  return (
    <div className="app">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
      <header className="app-header">
        <h1>Chat App</h1>
        {username && (
          <button 
            onClick={handleLogout}
            className="logout-button"
            aria-label="Logout"
          >
            Logout
          </button>
        )}
      </header>
      <main className="app-main">
        {username ? (
          <ChatRoom username={username} />
        ) : (
          <LoginForm onLogin={handleLogin} />
        )}
      </main>
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Chat App. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
