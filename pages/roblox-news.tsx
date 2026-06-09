import { useState, useEffect } from "react";

interface RobloxTopic {
  title: string;
  description: string;
  source: string;
  date: string;
}

export default function RobloxNews() {
  const [topics, setTopics] = useState<RobloxTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/roblox/aggregate")
      .then((res) => res.json())
      .then((data) => {
        setTopics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Roblox News</h1>
      {topics.map((topic, i) => (
        <div key={i}>
          <h2>{topic.title}</h2>
          <p>{topic.description}</p>
          <small>{topic.source} | {topic.date}</small>
        </div>
      ))}
    </div>
  );
}
