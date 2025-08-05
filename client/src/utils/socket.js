import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export const socket = io(SOCKET_URL, { 
  withCredentials: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
}); 