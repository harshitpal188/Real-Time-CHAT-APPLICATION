import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';
const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 3000;

export default function useSocket({
  onMessage,
  onRoomUsers,
  onUserJoined,
  onUserLeft,
  onTyping,
  onStoppedTyping,
  onMessageHistory,
  onError,
  onMessageStatus,
}) {
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    const connectSocket = () => {
      try {
        socketRef.current = io(SOCKET_URL, {
          reconnectionAttempts: RECONNECTION_ATTEMPTS,
          reconnectionDelay: RECONNECTION_DELAY,
          transports: ['websocket', 'polling'],
        });

        // Socket event listeners
        socketRef.current.on('receive_message', onMessage);
        socketRef.current.on('room_users', onRoomUsers);
        socketRef.current.on('user_joined', onUserJoined);
        socketRef.current.on('user_left', onUserLeft);
        socketRef.current.on('user_typing', onTyping);
        socketRef.current.on('user_stopped_typing', onStoppedTyping);
        socketRef.current.on('message_history', onMessageHistory);
        socketRef.current.on('message_status', onMessageStatus);

        // Connection event handlers
        socketRef.current.on('connect', () => {
          console.log('Socket connected');
          reconnectAttemptsRef.current = 0;
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          onError(error);

          if (reconnectAttemptsRef.current < RECONNECTION_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            setTimeout(connectSocket, RECONNECTION_DELAY);
          } else {
            onError(new Error('Failed to connect after multiple attempts'));
          }
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            setTimeout(connectSocket, RECONNECTION_DELAY);
          }
        });

        socketRef.current.on('error', (error) => {
          console.error('Socket error:', error);
          onError(error);
        });

      } catch (error) {
        console.error('Socket initialization error:', error);
        onError(error);
      }
    };

    connectSocket();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [
    onMessage,
    onRoomUsers,
    onUserJoined,
    onUserLeft,
    onTyping,
    onStoppedTyping,
    onMessageHistory,
    onError,
    onMessageStatus,
  ]);

  return socketRef;
} 