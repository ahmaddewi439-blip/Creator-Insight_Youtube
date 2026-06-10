"use client";

import { useEffect, useState } from "react";

type VideoItem = {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  status: string; // "Published" atau "Scheduled"
  views?: number;
  likes?: number;
};

export default function VideoOptimizerPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchVideos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube/channel-videos");
      if (!res.ok) throw new Error("Gagal fetch videos dari API");
      const data: VideoItem[] = await res.json();
      setVideos(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Video Optimizer</h1>
      <button onClick={fetchVideos} style={{ marginBottom: "15px" }}>
        Refresh Data
      </button>
      {loading && <p>Loading videos...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #ccc" }}>
              <th>#</th>
              <th>Thumbnail</th>
              <th>Title</th>
              <th>Status</th>
              <th>Published At</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v, index) => (
              <tr key={v.videoId} style={{ borderBottom: "1px solid #eee" }}>
                <td>{index + 1}</td>
                <td>
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    style={{ width: "120px" }}
                  />
                </td>
                <td>{v.title}</td>
                <td>{v.status}</td>
                <td>{new Date(v.publishedAt).toLocaleString()}</td>
                <td>{v.views ?? "-"}</td>
                <td>{v.likes ?? "-"}</td>
                <td>
                  <button
                    onClick={() => alert(`Optimizing video: ${v.title}`)}
                    style={{ padding: "4px 8px", cursor: "pointer" }}
                  >
                    Optimize
                  </button>
                </td>
              </tr>
            ))}
            {videos.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "10px" }}>
                  Tidak ada video tersedia
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
