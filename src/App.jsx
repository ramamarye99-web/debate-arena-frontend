import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import HomeScreen from './components/HomeScreen';
import DebateRoom from './components/DebateRoom';
import './App.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' or 'debate'
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [debateId, setDebateId] = useState(null);

  // Initialize socket and user on mount
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      const uid = `user_${Date.now()}_${Math.random()}`;
      setUserId(uid);
      newSocket.emit('user-join', { userId: uid });
    });

    newSocket.on('opponent-found', (data) => {
      setOpponent(data.opponent);
      setDebateId(data.debateId);
      setScreen('debate');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    if (socket) {
      socket.emit('join-queue', { topic, userId });
    }
  };

  const handleEndDebate = () => {
    setScreen('home');
    setOpponent(null);
    setSelectedTopic(null);
    setDebateId(null);
  };

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen onSelectTopic={handleTopicSelect} userId={userId} />
      )}
      {screen === 'debate' && socket && (
        <DebateRoom
          socket={socket}
          userId={userId}
          opponent={opponent}
          topic={selectedTopic}
          debateId={debateId}
          onEndDebate={handleEndDebate}
        />
      )}
    </div>
  );
}
