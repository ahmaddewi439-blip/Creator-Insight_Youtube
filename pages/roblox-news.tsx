// pages/roblox-news.tsx
"use client";

import { useState, useEffect } from "react";

interface RobloxTopic {
  title: string;
  url: string;
  source: string; // devforum, newsroom, twitter
  date: string;
}

export default function RobloxNews() {
  const [topics, setTopics] = useState<RobloxTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/roblox/aggregate")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch Roblox news");
        return res.json();
      })
      .then((data) => {
        // Ambil maksimal 6 topik terbaru
        const latestTopics: RobloxTopic[] = data.slice(0, 6);
        setTopics(latestTopics);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading Roblox news...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Topik Roblox Terbaru</h1>
      <p>Data digabung dari DevForum, Newsroom, dan Twitter resmi Roblox.</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {topics.map((topic, index) => (
          <li
            key={index}
            style={{
              border: "1px solid #444",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <a
              href={topic.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: "bold", fontSize: "1.1rem" }}
            >
              {topic.title}
            </a>
            <div style={{ fontSize: "0.9rem", color: "#aaa" }}>
              Source: {topic.source} | Date: {topic.date}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
