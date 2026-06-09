"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ChannelStats = {
  subscribers?: number | string;
  views?: number | string;
  videos?: number | string;
};

type TopVideo = {
  id?: string;
  title: string;
  thumbnail?: string;
  views?: number | string;
  publishedAt?: string;
  url?: string;
};

type RobloxTopic = {
  id?: string;
  title: string;
  source?: string;
  url?: string;
  summary?: string;
  publishedAt?: string;
};

type DashboardData = {
  channelName: string;
  channelHandle?: string;
  channelStats: ChannelStats;
  topVideos: TopVideo[];
  robloxTopics: RobloxTopic[];
};

const fallbackData: DashboardData = {
  channelName: "Creator Insight",
  channelHandle: "@creator",
  channelStats: {
    subscribers: "-",
    views: "-",
    videos: "-",
  },
  topVideos: [],
  robloxTopics: [],
};

function formatNumber(value?: number | string) {
  if (value === undefined || value === null || value === "") return "-";

  const numberValue =
    typeof value === "string" ? Number(value.replace(/,/g, "")) : value;

  if (Number.isNaN(numberValue)) return String(value);

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(numberValue);
}

function normalizeVideos(data: unknown): TopVideo[] {
  if (!data || typeof data !== "object") return [];

  const obj = data as Record<string, unknown>;
  const rawVideos =
    obj.topVideos ||
    obj.videos ||
    obj.items ||
    [];

  if (!Array.isArray(rawVideos)) return [];

  return rawVideos
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const video = item as Record<string, unknown>;

      return {
        id: String(video.id || video.videoId || video.url || Math.random()),
        title: String(video.title || "Untitled Video"),
        thumbnail:
          typeof video.thumbnail === "string"
            ? video.thumbnail
            : typeof video.thumbnailUrl === "string"
              ? video.thumbnailUrl
              : "",
        views:
          typeof video.views === "string" || typeof video.views === "number"
            ? video.views
            : "-",
        publishedAt:
          typeof video.publishedAt === "string" ? video.publishedAt : "",
        url: typeof video.url === "string" ? video.url : "",
      };
    })
    .filter(Boolean) as TopVideo[];
}

function normalizeRobloxTopics(data: unknown): RobloxTopic[] {
  if (!data || typeof data !== "object") return [];

  const obj = data as Record<string, unknown>;
  const rawTopics =
    obj.topics ||
    obj.items ||
    obj.data ||
    [];

  if (!Array.isArray(rawTopics)) return [];

  return rawTopics
    .slice(0, 6)
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const topic = item as Record<string, unknown>;

      return {
        id: String(topic.id || topic.url || topic.title || Math.random()),
        title: String(topic.title || "Roblox Update"),
        source: typeof topic.source === "string" ? topic.source : "Roblox",
        url: typeof topic.url === "string" ? topic.url : "",
        summary: typeof topic.summary === "string" ? topic.summary : "",
        publishedAt:
          typeof topic.publishedAt === "string" ? topic.publishedAt : "",
      };
    })
    .filter(Boolean) as RobloxTopic[];
}

export default function CreatorInsightApp() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData>(fallbackData);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const refreshData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [youtubeResponse, robloxResponse] = await Promise.allSettled([
        fetch("/api/youtube/overview", {
          cache: "no-store",
        }),
        fetch("/api/roblox/aggregate", {
          cache: "no-store",
        }),
      ]);

      let youtubeData: unknown = null;
      let robloxData: unknown = null;

      if (
        youtubeResponse.status === "fulfilled" &&
        youtubeResponse.value.ok
      ) {
        youtubeData = await youtubeResponse.value.json();
      }

      if (
        robloxResponse.status === "fulfilled" &&
        robloxResponse.value.ok
      ) {
        robloxData = await robloxResponse.value.json();
      }

      const youtubeObj =
        youtubeData && typeof youtubeData === "object"
          ? (youtubeData as Record<string, unknown>)
          : {};

      const channelStats =
        youtubeObj.channelStats && typeof youtubeObj.channelStats === "object"
          ? (youtubeObj.channelStats as ChannelStats)
          : fallbackData.channelStats;

      setData({
        channelName:
          typeof youtubeObj.channelName === "string"
            ? youtubeObj.channelName
            : typeof youtubeObj.title === "string"
              ? youtubeObj.title
              : fallbackData.channelName,
        channelHandle:
          typeof youtubeObj.channelHandle === "string"
            ? youtubeObj.channelHandle
            : typeof youtubeObj.handle === "string"
              ? youtubeObj.handle
              : fallbackData.channelHandle,
        channelStats,
        topVideos: normalizeVideos(youtubeData),
        robloxTopics: normalizeRobloxTopics(robloxData),
      });
    } catch (error) {
      console.error(error);
      setErrorMessage("Gagal mengambil data terbaru. Coba refresh ulang.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const stats = useMemo(
    () => [
      {
        label: "Subscribers",
        value: formatNumber(data.channelStats.subscribers),
      },
      {
        label: "Views",
        value: formatNumber(data.channelStats.views),
      },
      {
        label: "Videos",
        value: formatNumber(data.channelStats.videos),
      },
    ],
    [data.channelStats]
  );

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <main className="creator-insight-app">
      <section className="creator-header">
        <div>
          <p className="creator-kicker">Creator Insight Dashboard</p>
          <h1>Overview</h1>
          <p className="creator-subtitle">
            Pantau performa YouTube, top videos, dan ide Roblox Shorts dari
            sumber update terbaru.
          </p>
        </div>

        <div className="creator-actions">
          <button
            type="button"
            className="refresh-button"
            onClick={() => void refreshData()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>

          <button type="button" className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      {errorMessage ? (
        <div className="error-box" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <section className="dashboard-grid">
        <article className="channel-card">
          <div className="channel-card-header">
            <div>
              <p className="card-label">YouTube Channel</p>
              <h2>{data.channelName}</h2>
              <p className="channel-handle">{data.channelHandle}</p>
            </div>
          </div>

          <div className="channel-stats">
            {stats.map((item) => (
              <div className="channel-stat" key={item.label}>
                <span className="channel-stat-value">{item.value}</span>
                <span className="channel-stat-label">{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="roblox-card">
          <div className="card-heading-row">
            <div>
              <p className="card-label">Roblox Official</p>
              <h2>Latest Roblox Topics</h2>
            </div>
            <a href="/roblox-news" className="text-link">
              View News
            </a>
          </div>

          <div className="roblox-topic-list">
            {data.robloxTopics.length > 0 ? (
              data.robloxTopics.map((topic) => (
                <a
                  className="roblox-topic-row"
                  key={topic.id || topic.title}
                  href={topic.url || "/roblox-news"}
                  target={topic.url ? "_blank" : "_self"}
                  rel="noreferrer"
                >
                  <span className="source-badge">{topic.source || "Roblox"}</span>
                  <div>
                    <h3>{topic.title}</h3>
                    {topic.summary ? <p>{topic.summary}</p> : null}
                  </div>
                </a>
              ))
            ) : (
              <p className="empty-state">
                Belum ada data Roblox. Klik Refresh Data atau cek API Roblox
                Aggregate.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="top-videos-card">
        <div className="card-heading-row">
          <div>
            <p className="card-label">YouTube Performance</p>
            <h2>Top Videos</h2>
          </div>
          <a href="/roblox-shorts" className="text-link">
            Generate Roblox Shorts
          </a>
        </div>

        <div className="top-videos-inner">
          {data.topVideos.length > 0 ? (
            data.topVideos.map((video) => (
              <a
                className="top-videos-row"
                key={video.id || video.title}
                href={video.url || "#"}
                target={video.url ? "_blank" : "_self"}
                rel="noreferrer"
              >
                <div className="top-video-thumb">
                  {video.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.thumbnail} alt={video.title} />
                  ) : (
                    <span>No Image</span>
                  )}
                </div>

                <div className="top-video-info">
                  <h3 className="top-video-title">{video.title}</h3>
                  <p>{formatNumber(video.views)} views</p>
                </div>
              </a>
            ))
          ) : (
            <p className="empty-state">
              Belum ada top videos. Pastikan API YouTube tersedia lalu klik
              Refresh Data.
            </p>
          )}
        </div>
      </section>

      <style jsx>{`
        .creator-insight-app {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 24px;
          color: #111827;
        }

        .creator-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .creator-kicker,
        .card-label {
          margin: 0 0 6px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #6366f1;
        }

        .creator-header h1 {
          margin: 0;
          font-size: clamp(28px, 5vw, 44px);
          line-height: 1.1;
        }

        .creator-subtitle {
          margin: 10px 0 0;
          max-width: 680px;
          color: #6b7280;
          line-height: 1.6;
        }

        .creator-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        button,
        .text-link {
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
        }

        .refresh-button {
          background: #111827;
          color: white;
        }

        .refresh-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .logout-button {
          background: #f3f4f6;
          color: #111827;
        }

        .text-link {
          background: #eef2ff;
          color: #4f46e5;
        }

        .error-box {
          margin-bottom: 16px;
          padding: 12px 14px;
          border-radius: 12px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 14px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
          gap: 18px;
          margin-bottom: 18px;
        }

        .channel-card,
        .roblox-card,
        .top-videos-card {
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          background: white;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
          overflow: hidden;
        }

        .channel-card h2,
        .roblox-card h2,
        .top-videos-card h2 {
          margin: 0;
          font-size: 22px;
        }

        .channel-handle {
          margin: 6px 0 0;
          color: #6b7280;
        }

        .channel-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 22px;
        }

        .channel-stat {
          min-width: 0;
          border-radius: 16px;
          background: #f9fafb;
          padding: 14px;
        }

        .channel-stat-value {
          display: block;
          font-size: 24px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .channel-stat-label {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .card-heading-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
        }

        .roblox-topic-list,
        .top-videos-inner {
          display: grid;
          gap: 12px;
        }

        .roblox-topic-row,
        .top-videos-row {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border: 1px solid #eef2f7;
          border-radius: 16px;
          text-decoration: none;
          color: inherit;
          background: #ffffff;
          min-width: 0;
        }

        .roblox-topic-row {
          align-items: flex-start;
        }

        .source-badge {
          flex: 0 0 auto;
          display: inline-flex;
          border-radius: 999px;
          background: #ecfeff;
          color: #0891b2;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 800;
        }

        .roblox-topic-row h3,
        .top-video-title {
          margin: 0;
          font-size: 15px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .roblox-topic-row p,
        .top-video-info p,
        .empty-state {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .top-video-thumb {
          flex: 0 0 96px;
          width: 96px;
          height: 56px;
          border-radius: 12px;
          background: #f3f4f6;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 12px;
        }

        .top-video-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .top-video-info {
          min-width: 0;
        }

        @media (max-width: 768px) {
          .creator-insight-app {
            padding: 16px;
          }

          .creator-header {
            flex-direction: column;
          }

          .creator-actions {
            width: 100%;
            justify-content: stretch;
          }

          .creator-actions button {
            flex: 1 1 140px;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .channel-stats {
            grid-template-columns: 1fr;
          }

          .card-heading-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .roblox-topic-row,
          .top-videos-row {
            align-items: flex-start;
          }

          .top-video-thumb {
            flex-basis: 82px;
            width: 82px;
            height: 50px;
          }
        }
      `}</style>
    </main>
  );
}
