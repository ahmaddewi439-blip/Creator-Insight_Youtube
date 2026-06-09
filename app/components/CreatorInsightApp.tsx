import React, { useState, useEffect } from "react";
import "./globals.css";

interface ChannelData {
  name: string;
  avatar: string;
  subscribers: number;
  totalViews: number;
  totalVideos: number;
  joinedDate: string;
  score: number;
}

interface VideoData {
  title: string;
  views: number;
  likes: number;
  uploadDate: string;
  thumbnail: string;
}

export default function CreatorInsightApp() {
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [topVideos, setTopVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChannelData() {
      try {
        const res = await fetch("/api/youtube/channel");
        const data = await res.json();
        setChannel(data.channel);
        setTopVideos(data.topVideos);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to fetch channel data");
        setLoading(false);
      }
    }

    fetchChannelData();
  }, []);
    return (
    <div className="app-container">
      {loading && <p>Loading channel data...</p>}
      {error && <p className="error">{error}</p>}
      {channel && (
        <div className="channel-card">
          <img src={channel.avatar} alt={channel.name} className="channel-avatar" />
          <h2 className="channel-name">{channel.name}</h2>
          <div className="channel-stats">
            <span>{channel.subscribers} Subscribers</span>
            <span>{channel.totalViews} Views</span>
            <span>{channel.totalVideos} Videos</span>
            <span>Joined {channel.joinedDate}</span>
          </div>
          <div className="channel-score">
            <span>Channel Score</span>
            <div className="score-bar">
              <div className="score-fill" style={{ width: `${channel.score}%` }} />
            </div>
            <span>{channel.score}</span>
          </div>
        </div>
      )}

      {topVideos.length > 0 && (
        <div className="top-videos-card">
          <h3>Top Videos</h3>
          <div className="top-videos-inner">
            {topVideos.map((video, idx) => (
              <div key={idx} className="top-videos-row">
                <img src={video.thumbnail} alt={video.title} className="top-video-thumb" />
                <div className="top-video-title">
                  <p>{video.title}</p>
                  <span>{video.views} views</span>
                  <span>{video.likes} likes</span>
                  <span>{video.uploadDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
      {/* Optional Footer or CTA */}
      <footer className="app-footer">
        <p>
          Data diambil langsung dari channel YouTube dan Roblox Shorts.
          Pastikan selalu refresh untuk update terbaru.
        </p>
      </footer>
    </div>
  );
}

export default CreatorInsightApp;
