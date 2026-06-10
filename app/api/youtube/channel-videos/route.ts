import { useEffect, useState } from "react";

type VideoItem = {
  videoId: string;
  title: string;
  description?: string;
  thumbnail: string;
  publishedAt?: string;
  views?: number;
  likes?: number;
};

export default function VideoOptimizerPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      try {
        const res = await fetch("/api/youtube/channel-videos");
        if (!res.ok) throw new Error("Failed to fetch videos");
        const data = await res.json();
        setVideos(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      }
      setLoading(false);
    }

    fetchVideos();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Video Optimizer</h1>
      <p>
        Pilih video publish/terjadwal dari channel, lalu AI akan memberi saran
        caption, deskripsi, hashtag, keyword, CTA, pinned comment, dan
        thumbnail text.
      </p>

      {loading && <p>Loading videos...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && videos.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Thumbnail
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Title</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Views</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Likes</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Status</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.videoId}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <img src={v.thumbnail} alt={v.title} width={120} />
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {v.title}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {v.views ?? "-"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {v.likes ?? "-"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {v.publishedAt ? "Published" : "Scheduled"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <button
                    onClick={() => alert(`Optimizing video: ${v.title}`)}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Optimize
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && videos.length === 0 && (
        <p>Tidak ada video yang tersedia.</p>
      )}
    </div>
  );
}
