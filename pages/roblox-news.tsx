// pages/roblox-news.tsx
"use client";

import { useEffect, useState } from "react";

type RobloxTopic = {
  title: string;
  link: string;
  source: string; // devforum, newsroom, twitter
  date?: string;
};

export default function RobloxNews() {
  const [topics, setTopics] = useState<RobloxTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch("/api/roblox/aggregate");
        const data: RobloxTopic[] = await res.json();

        // Ambil maksimal 6 topik terbaru
        const uniqueTitles = new Set<string>();
        const filtered: RobloxTopic[] = [];
        for (let t of data) {
          if (!uniqueTitles.has(t.title) && filtered.length < 6) {
            uniqueTitles.add(t.title);
            filtered.push(t);
          }
        }

        setTopics(filtered);
      } catch (err) {
        console.error("Failed to fetch Roblox topics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-medium">Loading Roblox news...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Roblox Official News</h1>
      <p className="mb-6 text-gray-600">
        Latest topics aggregated from Roblox Dev Forum, Newsroom, and Twitter.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {topics.map((t, idx) => (
          <a
            key={idx}
            href={t.link}
            target="_blank"
            rel="noopener noreferrer"
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500">
                {t.source.toUpperCase()}
              </span>
              {t.date && (
                <span className="text-xs text-gray-400">{t.date}</span>
              )}
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {t.title}
            </h2>
          </a>
        ))}
      </div>

      {topics.length === 0 && (
        <p className="text-gray-500 mt-4">No news available at the moment.</p>
      )}
    </div>
  );
}
