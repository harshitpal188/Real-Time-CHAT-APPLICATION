import React, { useState, useEffect, useCallback, useRef } from 'react';
import RoomList from './RoomList';
import UserList from './UserList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import useSocket from '../hooks/useSocket';
import toast from 'react-hot-toast';

// Sound utilities
const audioCache = new Map();
function playSound(type) {
  const url = type === 'message' ? '/sounds/message.mp3' : '/sounds/notify.mp3';
  
  if (!audioCache.has(url)) {
    const audio = new window.Audio(url);
    audio.volume = 0.5;
    audioCache.set(url, audio);
  }
  
  const audio = audioCache.get(url);
  audio.currentTime = 0;
  audio.play().catch(err => console.error('Error playing sound:', err));
}

function ChatRoom({ username }) {
  const [currentRoom, setCurrentRoom] = useState('General');
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [socketError, setSocketError] = useState('');
  const typingTimeoutRef = useRef(null);

  // Socket event handlers with memoization
  const onMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (prev.some(m => m.id === msg.id)) return prev;
      if (msg.username !== username) {
        playSound('message');
      }
      return [...prev, msg];
    });

    if (msg.id && msg.username !== username && socketRef.current) {
      socketRef.current.emit('message_received', { messageId: msg.id });
    }
  }, [username]);

  const onRoomUsers = useCallback(({ users }) => {
    setUsers(users);
  }, []);

  const onUserJoined = useCallback(({ username: joinedUser }) => {
    if (joinedUser !== username) {
      toast.success(`${joinedUser} joined the room`);
      playSound('notify');
    }
  }, [username]);

  const onUserLeft = useCallback(({ username: leftUser }) => {
    if (leftUser !== username) {
      toast(`${leftUser} left the room`, { icon: '👋' });
      playSound('notify');
    }
  }, [username]);

  const onTyping = useCallback(({ username: typingUser }) => {
    setTypingUsers(prev => prev.includes(typingUser) ? prev : [...prev, typingUser]);
  }, []);

  const onStoppedTyping = useCallback(({ username: stoppedUser }) => {
    setTypingUsers(prev => prev.filter(u => u !== stoppedUser));
  }, []);

  const onMessageHistory = useCallback(({ messages }) => {
    setMessages(messages);
  }, []);

  const onError = useCallback((err) => {
    const errorMessage = err.message || 'Connection error';
    setSocketError(errorMessage);
    toast.error(errorMessage);
  }, []);

  const onMessageStatus = useCallback(({ messageId, status }) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, status } : m
    ));
  }, []);

  const socketRef = useSocket({
    onMessage,
    onRoomUsers,
    onUserJoined,
    onUserLeft,
    onTyping,
    onStoppedTyping,
    onMessageHistory,
    onError,
    onMessageStatus,
  });

  // Join room effect
  useEffect(() => {
    if (!socketRef.current) {
      setSocketError('Unable to connect to chat server');
      return;
    }

    // Clear previous room data
    setMessages([]);
    setUsers([]);
    setTypingUsers([]);
    
    // Join new room
    socketRef.current.emit('join_room', { username, room: currentRoom });

    // Cleanup
    return () => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('leave_room', { username, room: currentRoom });
      }
    };
  }, [currentRoom, username]);

  // Handle message sending
  const handleSend = useCallback((msg) => {
    if (!msg.trim() || !socketRef.current) return;
    
    socketRef.current.emit('send_message', {
      room: currentRoom,
      message: msg,
      username,
      timestamp: Date.now(),
    });
  }, [currentRoom, username]);

  // Handle typing indication with debounce
  const handleTyping = useCallback((isTyping) => {
    if (!socketRef.current) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      socketRef.current.emit('typing_start', { room: currentRoom, username });
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing_stop', { room: currentRoom, username });
      }, 3000);
    } else {
      socketRef.current.emit('typing_stop', { room: currentRoom, username });
    }
  }, [currentRoom, username]);

  // Handle room switching
  const handleJoinRoom = useCallback((room) => {
    if (room !== currentRoom && socketRef.current) {
      setCurrentRoom(room);
    }
  }, [currentRoom]);

  if (socketError) {
    return (
      <div className="error-container">
        <div className="error-message">
          {socketError}
          <button onClick={() => window.location.reload()}>Reconnect</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chatroom-container">
      <aside className="sidebar">
        <RoomList 
          currentRoom={currentRoom} 
          onJoinRoom={handleJoinRoom} 
          socket={socketRef.current} 
        />
        <UserList users={users} />
      </aside>
      <main className="chat-main">
        <div className="chat-header">
          <h2>{currentRoom}</h2>
        </div>
        <MessageList 
          messages={messages} 
          currentUser={username} 
        />
        <TypingIndicator 
          typingUsers={typingUsers} 
          currentUser={username} 
        />
        <MessageInput 
          onSend={handleSend} 
          onTyping={handleTyping} 
        />
      </main>
    </div>
  );
}

export default ChatRoom; 