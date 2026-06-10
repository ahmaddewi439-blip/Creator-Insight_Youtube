"use client";
import { useEffect, useState } from "react";

type VideoItem = {
  videoId: string;
  title: string;
  publishedAt: string;
  views?: number;
  likes?: number;
  status?: string;
};

export default function VideoOptimizerPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadVideos() {
    setLoading(true);
    try {
      const res = await fetch("/api/youtube/channel-videos");
      const data: VideoItem[] = await res.json();
      setVideos(data);
    } catch (err) {
      console.error("Error loading videos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Video Optimizer</h1>
      <button onClick={loadVideos}>Refresh Data</button>
      {loading ? (
        <p>Loading videos...</p>
      ) : (
        <table>
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
            {videos.map((v, i) => (
              <tr key={v.videoId}>
                <td>{i + 1}</td>
                <td>{v.title}</td>
                <td>{v.views ?? "-"}</td>
                <td>{v.likes ?? "-"}</td>
                <td>{v.status ?? "Public"}</td>
                <td>
                  <button>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
