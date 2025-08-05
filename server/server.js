const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Constants
const MAX_MESSAGES = 100;
const INACTIVE_TIMEOUT = 1000 * 60 * 30; // 30 minutes
const TYPING_TIMEOUT = 3000; // 3 seconds

// Socket.io setup with improved error handling
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: false
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Express middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: false
}));
app.use(express.json());

// API endpoints
app.get('/api/rooms', (req, res) => {
  try {
    const roomList = Object.keys(rooms);
    res.json({ rooms: roomList });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// In-memory data stores with cleanup intervals
const rooms = {
  General: { users: new Set(), messages: [], typing: new Set(), lastActivity: Date.now() }
};
const userToRoom = new Map();
const userNames = new Map();
const messageReceipts = new Map();
const typingTimeouts = new Map();

// Helper: Clean up inactive rooms
function cleanupInactiveRooms() {
  const now = Date.now();
  Object.entries(rooms).forEach(([room, data]) => {
    if (room !== 'General' && now - data.lastActivity > INACTIVE_TIMEOUT && data.users.size === 0) {
      delete rooms[room];
      io.emit('room_deleted', { room });
    }
  });
}

// Helper: Update room activity
function updateRoomActivity(room) {
  if (rooms[room]) {
    rooms[room].lastActivity = Date.now();
  }
}

// Helper: Get users in a room
function getUsersInRoom(room) {
  return rooms[room] ? Array.from(rooms[room].users) : [];
}

// Helper: Get last messages
function getLastMessages(room) {
  return rooms[room] ? rooms[room].messages.slice(-MAX_MESSAGES) : [];
}

// Helper: Handle typing timeout
function handleTypingTimeout(socket, room, username) {
  const timeoutKey = `${socket.id}-${room}`;
  if (typingTimeouts.has(timeoutKey)) {
    clearTimeout(typingTimeouts.get(timeoutKey));
  }
  
  typingTimeouts.set(timeoutKey, setTimeout(() => {
    if (rooms[room]?.typing.has(username)) {
      rooms[room].typing.delete(username);
      socket.to(room).emit('user_stopped_typing', { username, room });
    }
    typingTimeouts.delete(timeoutKey);
  }, TYPING_TIMEOUT));
}

io.on('connection', (socket) => {
  // Send initial list of rooms to the connected client
  socket.emit('room_list', { rooms: Object.keys(rooms) });

  // Join room
  socket.on('join_room', ({ username, room }) => {
    try {
      // Create room if it doesn't exist
      if (!rooms[room]) {
        rooms[room] = { users: new Set(), messages: [], typing: new Set(), lastActivity: Date.now() };
        io.emit('room_created', { room });
      }

      // Leave current room if in one
      const currentRoom = userToRoom.get(socket.id);
      if (currentRoom) {
        const currentUsername = userNames.get(socket.id);
        rooms[currentRoom].users.delete(currentUsername);
        rooms[currentRoom].typing.delete(currentUsername);
        socket.leave(currentRoom);
        io.to(currentRoom).emit('user_left', { username: currentUsername, room: currentRoom });
        io.to(currentRoom).emit('room_users', { users: getUsersInRoom(currentRoom), room: currentRoom });
      }

      // Join new room
      rooms[room].users.add(username);
      userToRoom.set(socket.id, room);
      userNames.set(socket.id, username);
      socket.join(room);
      updateRoomActivity(room);

      // Send room updates
      io.emit('room_updated', { rooms: Object.keys(rooms) });
      io.to(room).emit('room_users', { users: getUsersInRoom(room), room });
      socket.emit('message_history', { messages: getLastMessages(room), room });
      socket.to(room).emit('user_joined', { username, room });
    } catch (error) {
      console.error('Error in join_room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Send message
  socket.on('send_message', ({ room, message, username, timestamp }) => {
    try {
      if (!rooms[room]) return;
      
      const msgObj = {
        id: uuidv4(),
        message: message.slice(0, 1000), // Limit message length
        username,
        timestamp,
        status: 'sent'
      };

      rooms[room].messages.push(msgObj);
      if (rooms[room].messages.length > MAX_MESSAGES) {
        rooms[room].messages = rooms[room].messages.slice(-MAX_MESSAGES);
      }

      messageReceipts.set(msgObj.id, new Set([username]));
      updateRoomActivity(room);
      
      io.to(room).emit('receive_message', { ...msgObj, room });
      socket.emit('message_status', { messageId: msgObj.id, status: 'delivered' });
    } catch (error) {
      console.error('Error in send_message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Message receipt handling
  socket.on('message_received', ({ messageId }) => {
    try {
      const username = userNames.get(socket.id);
      const receipts = messageReceipts.get(messageId);
      if (!username || !receipts) return;

      receipts.add(username);
      const room = userToRoom.get(socket.id);
      
      if (room && rooms[room]) {
        const users = getUsersInRoom(room);
        if (users.every(u => receipts.has(u))) {
          const msg = rooms[room].messages.find(m => m.id === messageId);
          if (msg) {
            msg.status = 'read';
            io.to(room).emit('message_status', { messageId, status: 'read' });
          }
        }
      }
    } catch (error) {
      console.error('Error in message_received:', error);
    }
  });

  // Typing indicators
  socket.on('typing_start', ({ room, username }) => {
    try {
      if (!rooms[room]) return;
      rooms[room].typing.add(username);
      socket.to(room).emit('user_typing', { username, room });
      handleTypingTimeout(socket, room, username);
      updateRoomActivity(room);
    } catch (error) {
      console.error('Error in typing_start:', error);
    }
  });

  socket.on('typing_stop', ({ room, username }) => {
    try {
      if (!rooms[room]) return;
      rooms[room].typing.delete(username);
      socket.to(room).emit('user_stopped_typing', { username, room });
      updateRoomActivity(room);
    } catch (error) {
      console.error('Error in typing_stop:', error);
    }
  });

  // Leave room
  socket.on('leave_room', ({ username, room }) => {
    try {
      if (!rooms[room]) return;
      rooms[room].users.delete(username);
      rooms[room].typing.delete(username);
      socket.leave(room);
      io.to(room).emit('user_left', { username, room });
      io.to(room).emit('room_users', { users: getUsersInRoom(room), room });
      io.emit('room_updated', { rooms: Object.keys(rooms) });
      userToRoom.delete(socket.id);
      userNames.delete(socket.id);
      updateRoomActivity(room);
    } catch (error) {
      console.error('Error in leave_room:', error);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    try {
      const room = userToRoom.get(socket.id);
      const username = userNames.get(socket.id);
      
      if (room && rooms[room] && username) {
        rooms[room].users.delete(username);
        rooms[room].typing.delete(username);
        io.to(room).emit('user_left', { username, room });
        io.to(room).emit('room_users', { users: getUsersInRoom(room), room });
        io.emit('room_updated', { rooms: Object.keys(rooms) });
        updateRoomActivity(room);
      }

      // Cleanup
      userToRoom.delete(socket.id);
      userNames.delete(socket.id);
      const timeoutKey = `${socket.id}-${room}`;
      if (typingTimeouts.has(timeoutKey)) {
        clearTimeout(typingTimeouts.get(timeoutKey));
        typingTimeouts.delete(timeoutKey);
      }
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });
});

// Cleanup intervals
// setInterval(cleanupInactiveRooms, INACTIVE_TIMEOUT);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Server startup
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Initial rooms:', Object.keys(rooms));
});

// Cleanup intervals
setInterval(cleanupInactiveRooms, 1000 * 60 * 5); // Check every 5 minutes 