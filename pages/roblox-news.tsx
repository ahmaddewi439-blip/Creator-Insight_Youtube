// pages/roblox-news.tsx
"use client";

import { useEffect, useState } from "react";

interface RobloxTopic {
  title: string;
  link: string;
  source: string;
  date: string;
}

const sourceColors: Record<string, string> = {
  "Dev Forum": "bg-blue-500",
  "Newsroom": "bg-green-500",
  "Twitter": "bg-cyan-500",
};

export default function RobloxNews() {
  const [topics, setTopics] = useState<RobloxTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/roblox/aggregate")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch Roblox news.");
        return res.json();
      })
      .then((data) => {
        const topTopics = data.slice(0, 6).map((t: any) => ({
          title: t.title,
          link: t.link,
          source: t.source,
          date: t.date,
        }));
        setTopics(topTopics);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Tidak bisa memuat berita Roblox terbaru.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Berita Roblox Terbaru</h1>

      {loading && <p className="text-center">Memuat berita terbaru...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && topics.length === 0 && (
        <p className="text-center">Tidak ada berita terbaru saat ini.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!loading &&
          !error &&
          topics.map((topic, idx) => (
            <a
              key={idx}
              href={topic.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block border rounded-lg shadow-md hover:shadow-xl transition bg-white dark:bg-gray-800 p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`text-xs font-semibold text-white px-2 py-1 rounded ${sourceColors[topic.source]}`}
                >
                  {topic.source}
                </span>
                <span className="text-gray-400 text-xs">{new Date(topic.date).toLocaleDateString()}</span>
              </div>
              <h2 className="font-semibold text-lg dark:text-white">{topic.title}</h2>
            </a>
          ))}
      </div>
    </div>
  );
}
