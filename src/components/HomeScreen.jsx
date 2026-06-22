import React, { useState, useEffect } from 'react';

const TOPICS = [
  { id: 1, name: 'AI is better than humans', debaters: 342, debates: 1200 },
  { id: 2, name: 'Cryptocurrency has real value', debaters: 218, debates: 856 },
  { id: 3, name: 'Remote work is better than office', debaters: 521, debates: 2100 },
  { id: 4, name: 'Vegan diet is healthier', debaters: 189, debates: 634 },
  { id: 5, name: 'Social media is net negative', debaters: 412, debates: 1823 },
  { id: 6, name: 'Universal basic income works', debaters: 267, debates: 945 },
];

export default function HomeScreen({ onSelectTopic, userId }) {
  const [userDebates, setUserDebates] = useState(0);
  const [userRank, setUserRank] = useState('Beginner');

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('debates')
          .select('*')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
        if (data) setUserDebates(data.length);
      } catch (err) {
        console.error('Error fetching user stats:', err);
      }
    };

    fetchUserStats();
  }, [userId]);

  return (
    <div className="home-screen">
      <header className="header">
        <h1>Debate Arena</h1>
        <p>1-on-1 live debates on topics you care about</p>
      </header>

      <main className="home-content">
        <h2>Choose a topic</h2>
        <div className="topic-grid">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              className="topic-card"
              onClick={() => onSelectTopic(topic.name)}
            >
              <p className="topic-name">{topic.name}</p>
              <p className="topic-stats">
                {topic.debaters} debaters • {topic.debates} debates
              </p>
            </button>
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>
          Your debate rank: <strong>{userRank}</strong> • {userDebates} debates completed
        </p>
      </footer>
    </div>
  );
}
