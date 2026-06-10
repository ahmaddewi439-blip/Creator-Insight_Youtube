"use client";

import { useEffect, useState } from "react";

export type VideoItem = {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  views?: number;
  likes?: number;
  status?: "Published" | "Scheduled" | "Private";
};

export default function VideoOptimizerPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadVideos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube/channel-videos");
      const data = await res.json();
      if (res.ok) {
        setVideos(data);
      } else {
        setError(data.error || "Failed to fetch videos");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Video Optimizer</h1>
      <button
        onClick={loadVideos}
        style={{
          padding: "10px 20px",
          backgroundColor: "#2563EB",
          color: "#fff",
          borderRadius: "5px",
          marginBottom: "15px",
        }}
      >
        Refresh Data
      </button>

      {loading && <p>Loading videos...</p>}
      {error && (
        <p style={{ color: "red", fontWeight: "bold" }}>Error: {error}</p>
      )}

      {!loading && !error && videos.length === 0 && (
        <p>No videos found</p>
      )}

      {videos.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr>
              <th>#</th>
              <th>Video</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v, idx) => (
              <tr key={v.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td>{idx + 1}</td>
                <td style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    width={120}
                    style={{ borderRadius: "5px" }}
                  />
                  <div>
                    <strong>{v.title}</strong>
                    <p style={{ fontSize: "0.8rem", color: "#555" }}>
                      {v.description?.slice(0, 80)}...
                    </p>
                  </div>
                </td>
                <td>{v.views ?? "-"}</td>
                <td>{v.likes ?? "-"}</td>
                <td>{v.status ?? "Unknown"}</td>
                <td>
                  <button
                    onClick={() => window.open(`https://youtu.be/${v.id}`, "_blank")}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#10B981",
                      color: "#fff",
                      borderRadius: "5px",
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
