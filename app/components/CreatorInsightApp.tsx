// app/components/CreatorInsightApp.tsx
"use client";

import React, { useState, useEffect } from "react";
import { fetchChannels, fetchTopVideos } from "../api/roblox/queries";

export default function CreatorInsightApp() {
  const [channels, setChannels] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const ch = await fetchChannels();
      setChannels(ch);
      const vids = await fetchTopVideos();
      setVideos(vids);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Creator Insight Dashboard</h1>

      {/* Channel Card Section */}
      <div className="space-y-4">
        {channels.map((channel, idx) => (
          <div
            key={idx}
            className="channel-card rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex items-center space-x-4 mb-4">
              <img
                src={channel.thumbnail}
                alt={channel.title}
                className="w-20 h-20 rounded-full"
              />
              <div>
                <h2 className="text-xl font-bold">{channel.title}</h2>
                <p className="text-gray-500">@{channel.username}</p>
              </div>
            </div>

            <div className="channel-stats grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="channel-stat text-center">
                <strong>{channel.subscriberCount}</strong>
                <span>Subscribers</span>
              </div>
              <div className="channel-stat text-center">
                <strong>{channel.totalViews}</strong>
                <span>Total Views</span>
              </div>
              <div className="channel-stat text-center">
                <strong>{channel.totalVideos}</strong>
                <span>Total Videos</span>
              </div>
              <div className="channel-stat text-center">
                <strong>{channel.joined}</strong>
                <span>Joined</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Videos Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-2">Top Videos</h2>
        <div className="top-videos-card rounded-3xl border border-white/10 bg-white/5 p-6 overflow-x-auto">
          <div className="top-videos-inner min-w-[680px]">
            <div className="top-videos-row grid grid-cols-[40px_1fr_80px_80px] gap-4 mb-2 font-semibold">
              <div>#</div>
              <div>Video</div>
              <div>Views</div>
              <div>Likes</div>
            </div>

            {videos.map((video, idx) => (
              <div
                key={idx}
                className="top-videos-row grid grid-cols-[40px_1fr_80px_80px] gap-4 mb-2 items-center"
              >
                <div>{idx + 1}</div>
                <div className="flex items-center space-x-2">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="top-video-thumb w-24 h-14 rounded-xl"
                  />
                  <p className="top-video-title font-bold">{video.title}</p>
                </div>
                <div>{video.views}</div>
                <div>{video.likes}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
