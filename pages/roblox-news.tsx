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

  const sourceColors: { [key: string]: string } = {
    devforum: "#ff6f61",
    newsroom: "#1a73e8",
    twitter: "#00acee",
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          backgroundColor: "#222",
          color: "#fff",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "2rem",
          fontWeight: "bold",
          fontSize: "1.1rem",
          textAlign: "center",
        }}
      >
        Data digabung dari{" "}
        <span style={{ textDecoration: "underline", color: "#ff6f61" }}>DevForum</span>,{" "}
        <span style={{ textDecoration: "underline", color: "#1a73e8" }}>Newsroom</span>, dan{" "}
        <span style={{ textDecoration: "underline", color: "#00acee" }}>Twitter resmi Roblox</span>
      </div>

      {loading && <div>Loading Roblox news...</div>}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        {topics.map((topic, index) => (
          <a
            key={index}
            href={topic.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              borderRadius: "10px",
              padding: "1rem",
              backgroundColor: "#1e1e1e",
              color: "#fff",
              borderLeft: `6px solid ${sourceColors[topic.source] || "#888"}`,
              textDecoration: "none",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.02)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                "0 4px 15px rgba(0,0,0,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: "1.15rem", marginBottom: "0.5rem" }}>
              {topic.title}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.85rem",
                color: "#ccc",
              }}
            >
              <span>Source: {topic.source}</span>
              <span>Date: {topic.date}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
