import React, { useState, useEffect, useRef } from 'react';

export default function DebateRoom({ socket, userId, opponent, topic, debateId, onEndDebate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [isYourTurn, setIsYourTurn] = useState(true);
  const [debateEnded, setDebateEnded] = useState(false);
  const messagesEndRef = useRef(null);

  // Timer
  useEffect(() => {
    if (timeLeft === 0 || debateEnded) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, debateEnded]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('receive-message', (data) => {
      setMessages((prev) => [
        ...prev,
        { sender: 'opponent', text: data.text, timestamp: new Date() },
      ]);
      setIsYourTurn(true);
    });

    socket.on('debate-ended', () => {
      setDebateEnded(true);
    });

    return () => {
      socket.off('receive-message');
      socket.off('debate-ended');
    };
  }, [socket]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || !isYourTurn || debateEnded) return;

    const newMessage = {
      sender: 'you',
      text: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    socket.emit('send-message', { text: input, debateId, to: opponent.userId });
    setInput('');
    setIsYourTurn(false);
    setTimeLeft(180); // Reset timer for opponent
  };

  const handleConcede = () => {
    socket.emit('concede-debate', { debateId });
    setDebateEnded(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (debateEnded) {
    return (
      <div className="debate-ended-screen">
        <h2>Debate ended</h2>
        <p>Thanks for debating on: <strong>{topic}</strong></p>
        <button onClick={onEndDebate} className="btn-primary">
          Return to home
        </button>
      </div>
    );
  }

  return (
    <div className="debate-room">
      <div className="debate-header">
        <h2>{topic}</h2>
        <div className="timer" style={{ color: timeLeft < 30 ? '#e74c3c' : '#fff' }}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="debate-content">
        {/* Your side */}
        <div className="debate-side your-side">
          <h3>You</h3>
          <div className="turn-indicator" style={{ opacity: isYourTurn ? 1 : 0.5 }}>
            {isYourTurn ? '🟢 Your turn' : '⏳ Waiting for opponent'}
          </div>
          <div className="message-display">
            {messages.filter((m) => m.sender === 'you').length > 0 ? (
              messages
                .filter((m) => m.sender === 'you')
                .map((m, i) => (
                  <div key={i} className="message my-message">
                    {m.text}
                  </div>
                ))
            ) : (
              <p className="placeholder">Your arguments will appear here</p>
            )}
          </div>
        </div>

        {/* Opponent side */}
        <div className="debate-side opponent-side">
          <h3>{opponent?.name || 'Opponent'}</h3>
          <div className="turn-indicator" style={{ opacity: !isYourTurn ? 1 : 0.5 }}>
            {!isYourTurn ? '🟢 Their turn' : '⏳ Waiting...'}
          </div>
          <div className="message-display">
            {messages.filter((m) => m.sender === 'opponent').length > 0 ? (
              messages
                .filter((m) => m.sender === 'opponent')
                .map((m, i) => (
                  <div key={i} className="message opponent-message">
                    {m.text}
                  </div>
                ))
            ) : (
              <p className="placeholder">Opponent's arguments will appear here</p>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input section */}
      <div className="debate-footer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder={isYourTurn ? 'Type your argument...' : 'Wait for your turn...'}
          disabled={!isYourTurn || debateEnded}
          className="debate-input"
        />
        <div className="debate-buttons">
          <button
            onClick={handleSendMessage}
            disabled={!isYourTurn || !input.trim() || debateEnded}
            className="btn-primary"
          >
            Send argument
          </button>
          <button onClick={handleConcede} className="btn-secondary">
            Concede
          </button>
          <button onClick={onEndDebate} className="btn-secondary">
            End debate
          </button>
        </div>
      </div>
    </div>
  );
}
