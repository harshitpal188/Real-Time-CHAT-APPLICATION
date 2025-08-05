import React, { useEffect, useState, useCallback, memo } from 'react';

// Force the server URL to be correct
const SERVER_URL = 'http://localhost:3001';

const RoomList = memo(({ currentRoom, onJoinRoom, socket }) => {
  const [rooms, setRooms] = useState(['General']); // Default room
  const [newRoom, setNewRoom] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await fetch(`${SERVER_URL}/api/rooms`);

      if (!res.ok) {
        throw new Error(`Failed to fetch rooms (${res.status})`);
      }

      const data = await res.json();
      if (!Array.isArray(data.rooms)) {
        throw new Error('Invalid response format');
      }

      setRooms(prev => {
        const allRooms = Array.from(new Set(['General', ...data.rooms]));
        return JSON.stringify(prev) === JSON.stringify(allRooms) ? prev : allRooms;
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      // Only show error if we have no rooms except General
      if (rooms.length <= 1) {
        setError('Failed to fetch rooms');
      }
    } finally {
      setIsLoading(false);
    }
  }, [rooms.length]);

  // Initial fetch and socket setup
  useEffect(() => {
    let retryTimeout;
    const fetchAndRetry = async () => {
      try {
        await fetchRooms();
      } catch (err) {
        // Retry after 5 seconds if initial fetch fails
        retryTimeout = setTimeout(fetchAndRetry, 5000);
      }
    };

    fetchAndRetry();

    if (socket) {
      const handleRoomCreated = ({ room }) => {
        setRooms(prev => {
          if (prev.includes(room)) return prev;
          return [...prev, room];
        });
        setError(null); // Clear any existing errors when we successfully get updates
      };

      const handleRoomDeleted = ({ room }) => {
        setRooms(prev => prev.filter(r => r !== room));
      };

      const handleRoomUpdated = ({ rooms: updatedRooms }) => {
        setRooms(prev => {
          const allRooms = Array.from(new Set(['General', ...updatedRooms]));
          return JSON.stringify(prev) === JSON.stringify(allRooms) ? prev : allRooms;
        });
        setError(null); // Clear any existing errors when we successfully get updates
      };

      socket.on('room_created', handleRoomCreated);
      socket.on('room_deleted', handleRoomDeleted);
      socket.on('room_updated', handleRoomUpdated);
      socket.on('connect', fetchRooms);
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        // Only show connection error if we have no rooms except General
        if (rooms.length <= 1) {
          setError('Connection error - retrying...');
        }
      });

      socket.on('room_list', ({ rooms: initialRooms }) => {
        setRooms(prev => {
          const allRooms = Array.from(new Set(['General', ...initialRooms]));
          return JSON.stringify(prev) === JSON.stringify(allRooms) ? prev : allRooms;
        });
        setError(null);
        setIsLoading(false);
      });

      return () => {
        socket.off('room_created', handleRoomCreated);
        socket.off('room_deleted', handleRoomDeleted);
        socket.off('room_updated', handleRoomUpdated);
        socket.off('connect', fetchRooms);
        socket.off('connect_error');
        socket.off('room_list');
        clearTimeout(retryTimeout);
      };
    }

    return () => clearTimeout(retryTimeout);
  }, [socket, fetchRooms, rooms.length]);

  const handleJoin = useCallback((room) => {
    if (room !== currentRoom) {
      setError(null);
      onJoinRoom(room);
    }
  }, [currentRoom, onJoinRoom]);

  const handleCreate = useCallback((e) => {
    e.preventDefault();
    const trimmedRoom = newRoom.trim();
    
    if (!trimmedRoom) return;
    
    if (rooms.includes(trimmedRoom)) {
      handleJoin(trimmedRoom);
      setNewRoom('');
      return;
    }

    setError(null);
    setRooms(prev => [...prev, trimmedRoom]);
    
    if (socket) {
      socket.emit('create_room', { room: trimmedRoom });
    }
    
    onJoinRoom(trimmedRoom);
    setNewRoom('');
  }, [newRoom, rooms, socket, handleJoin, onJoinRoom]);

  const handleInputChange = useCallback((e) => {
    setNewRoom(e.target.value);
  }, []);

  return (
    <div className="room-list">
      <h3>Rooms</h3>
      {error && <div className="error">{error}</div>}
      <ul>
        {rooms.map(room => (
          <li key={room} className={room === currentRoom ? 'active' : ''}>
            <button 
              onClick={() => handleJoin(room)}
              className={room === currentRoom ? 'active' : ''}
              aria-current={room === currentRoom ? 'true' : 'false'}
            >
              {room}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreate} className="create-room-form">
        <input
          type="text"
          placeholder="New room name"
          value={newRoom}
          onChange={handleInputChange}
          aria-label="New room name"
          minLength={1}
          maxLength={30}
        />
        <button 
          type="submit" 
          disabled={!newRoom.trim()}
          aria-label="Create or join room"
        >
          Create/Join
        </button>
      </form>
    </div>
  );
});

RoomList.displayName = 'RoomList';

export default RoomList; 