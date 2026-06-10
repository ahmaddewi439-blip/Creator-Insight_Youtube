const fs = require("fs");
const path = require("path");

function backup(file) {
  if (fs.existsSync(file)) {
    const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    fs.copyFileSync(file, file + ".BEFORE_PUBLISH_SCHEDULE_FIX_" + stamp);
    console.log("Backup:", file);
  }
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trimStart(), "utf8");
  console.log("Updated:", file);
}

backup("app/api/youtube/channel-videos/route.ts");
backup("app/lib/youtube/fetchVideos.ts");
backup("app/video-optimizer/page.tsx");

write(
  "app/api/youtube/channel-videos/route.ts",
  String.raw`
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchChannelVideos, fetchPublicChannelVideos } from "@/app/lib/youtube/fetchVideos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken as string | undefined;

    const videos = accessToken
      ? await fetchChannelVideos(accessToken)
      : await fetchPublicChannelVideos();

    return NextResponse.json({
      ok: true,
      videos,
    });
  } catch (err: any) {
    console.error("Failed to fetch YouTube videos:", err);

    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to fetch YouTube videos",
      },
      { status: 500 }
    );
  }
}
`
);

write(
  "app/lib/youtube/fetchVideos.ts",
  String.raw`
export type VideoItem = {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  publishAt: string;
  channelTitle: string;
  views: number;
  likes: number;
  status: string;
  privacyStatus: string;
  url: string;
};

export type ChannelInfo = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  subscribers: number;
  totalViews: number;
  totalVideos: number;
};

type SearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    publishedAt?: string;
  };
};

type VideoDetailItem = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelTitle?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
  };
  status?: {
    privacyStatus?: string;
    publishAt?: string;
  };
};

type ChannelItem = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
};

function getVideoStatus(privacyStatus?: string, publishAt?: string) {
  if (privacyStatus === "private" && publishAt) return "Scheduled";
  if (privacyStatus === "public") return "Published";
  if (privacyStatus === "unlisted") return "Unlisted";
  if (privacyStatus === "private") return "Private";
  return "-";
}

function mapVideo(video: VideoDetailItem): VideoItem {
  const id = video.id ?? "";
  const privacyStatus = video.status?.privacyStatus ?? "";
  const publishAt = video.status?.publishAt ?? "";

  return {
    id,
    videoId: id,
    title: video.snippet?.title ?? "Untitled Video",
    description: video.snippet?.description ?? "",
    thumbnail:
      video.snippet?.thumbnails?.high?.url ??
      video.snippet?.thumbnails?.medium?.url ??
      video.snippet?.thumbnails?.default?.url ??
      "",
    publishedAt: video.snippet?.publishedAt ?? "",
    publishAt,
    channelTitle: video.snippet?.channelTitle ?? "",
    views: Number(video.statistics?.viewCount ?? 0),
    likes: Number(video.statistics?.likeCount ?? 0),
    status: getVideoStatus(privacyStatus, publishAt),
    privacyStatus,
    url: id ? "https://www.youtube.com/watch?v=" + id : "",
  };
}

async function fetchJson<T>(
  url: URL,
  options?: {
    accessToken?: string;
  }
): Promise<T> {
  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: options?.accessToken
      ? {
          Authorization: "Bearer " + options.accessToken,
        }
      : undefined,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || "Gagal mengambil data YouTube.");
  }

  return JSON.parse(text) as T;
}

export async function fetchPublicChannelVideos(): Promise<VideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY belum diisi di Vercel.");
  }

  if (!channelId) {
    throw new Error("YOUTUBE_CHANNEL_ID belum diisi di Vercel.");
  }

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "50");
  searchUrl.searchParams.set("key", apiKey);

  const searchData = await fetchJson<{ items?: SearchItem[] }>(searchUrl);

  const videoIds =
    searchData.items
      ?.map((item) => item.id?.videoId)
      .filter(Boolean)
      .join(",") ?? "";

  if (!videoIds) {
    return [];
  }

  const detailUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailUrl.searchParams.set("part", "snippet,statistics,status");
  detailUrl.searchParams.set("id", videoIds);
  detailUrl.searchParams.set("key", apiKey);

  const detailData = await fetchJson<{ items?: VideoDetailItem[] }>(detailUrl);

  return detailData.items?.map(mapVideo) ?? [];
}

export async function fetchChannelVideos(accessToken?: string): Promise<VideoItem[]> {
  if (!accessToken || accessToken.startsWith("AIza")) {
    return fetchPublicChannelVideos();
  }

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "id,snippet");
  searchUrl.searchParams.set("forMine", "true");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "50");

  const searchData = await fetchJson<{ items?: SearchItem[] }>(searchUrl, {
    accessToken,
  });

  const videoIds =
    searchData.items
      ?.map((item) => item.id?.videoId)
      .filter(Boolean)
      .join(",") ?? "";

  if (!videoIds) {
    return [];
  }

  const detailUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailUrl.searchParams.set("part", "snippet,statistics,status");
  detailUrl.searchParams.set("id", videoIds);

  const detailData = await fetchJson<{ items?: VideoDetailItem[] }>(detailUrl, {
    accessToken,
  });

  return detailData.items?.map(mapVideo) ?? [];
}

export async function fetchChannelInfo(): Promise<ChannelInfo> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY belum diisi di Vercel.");
  }

  if (!channelId) {
    throw new Error("YOUTUBE_CHANNEL_ID belum diisi di Vercel.");
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("id", channelId);
  url.searchParams.set("key", apiKey);

  const data = await fetchJson<{ items?: ChannelItem[] }>(url);
  const channel = data.items?.[0];

  if (!channel) {
    throw new Error("Channel tidak ditemukan. Cek YOUTUBE_CHANNEL_ID.");
  }

  return {
    id: channel.id ?? "",
    title: channel.snippet?.title ?? "",
    description: channel.snippet?.description ?? "",
    thumbnail:
      channel.snippet?.thumbnails?.high?.url ??
      channel.snippet?.thumbnails?.medium?.url ??
      channel.snippet?.thumbnails?.default?.url ??
      "",
    publishedAt: channel.snippet?.publishedAt ?? "",
    subscribers: Number(channel.statistics?.subscriberCount ?? 0),
    totalViews: Number(channel.statistics?.viewCount ?? 0),
    totalVideos: Number(channel.statistics?.videoCount ?? 0),
  };
}
`
);

write(
  "app/video-optimizer/page.tsx",
  String.raw`
"use client";

import { useEffect, useState } from "react";

type VideoItem = {
  id?: string;
  videoId?: string;
  title: string;
  thumbnail?: string;
  publishedAt?: string;
  publishAt?: string;
  views?: number;
  likes?: number;
  status?: string;
  url?: string;
};

export default function VideoOptimizerPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadVideos() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/youtube/channel-videos", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Gagal mengambil data video.");
      }

      const list = Array.isArray(data) ? data : data.videos ?? [];
      setVideos(list);
    } catch (err: any) {
      console.error("Error loading videos:", err);
      setError(err?.message || "Gagal mengambil data video.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  const publishedCount = videos.filter((v) => v.status === "Published").length;
  const scheduledCount = videos.filter((v) => v.status === "Scheduled").length;

  return (
    <div style={{ padding: "32px", color: "#f8fafc" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", margin: 0 }}>Video Optimizer</h1>
          <p style={{ color: "#94a3b8", marginTop: "8px" }}>
            Pilih video published atau scheduled dari channel kamu, lalu AI akan memberi saran caption, deskripsi, hashtag, keyword, CTA, pinned comment, dan thumbnail text.
          </p>
        </div>

        <button
          onClick={loadVideos}
          disabled={loading}
          style={{
            background: "#22c55e",
            color: "#020617",
            border: "0",
            padding: "12px 18px",
            borderRadius: "12px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {loading ? "Loading..." : "Refresh Video"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px", marginBottom: "20px" }}>
        <div style={cardStyle}>
          <p style={labelStyle}>Total Video Terbaca</p>
          <h2 style={numberStyle}>{videos.length}</h2>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Published</p>
          <h2 style={numberStyle}>{publishedCount}</h2>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Scheduled</p>
          <h2 style={numberStyle}>{scheduledCount}</h2>
        </div>
      </div>

      <div style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Daftar Video</h2>

        {loading && <p style={{ color: "#94a3b8" }}>Mengambil data video YouTube...</p>}

        {error && (
          <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.45)", color: "#fecaca", padding: "14px", borderRadius: "12px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {!loading && !error && videos.length === 0 && (
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8", padding: "18px", borderRadius: "14px" }}>
            Belum ada video yang terbaca. Coba logout, login ulang dengan akun YouTube, lalu klik Refresh Video.
          </div>
        )}

        {!loading && videos.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "#cbd5e1", borderBottom: "1px solid #1e293b" }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Video</th>
                  <th style={thStyle}>Views</th>
                  <th style={thStyle}>Likes</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Tanggal</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>

              <tbody>
                {videos.map((v, i) => {
                  const id = v.videoId || v.id || String(i);
                  const dateText =
                    v.status === "Scheduled" && v.publishAt
                      ? new Date(v.publishAt).toLocaleString("id-ID")
                      : v.publishedAt
                      ? new Date(v.publishedAt).toLocaleString("id-ID")
                      : "-";

                  return (
                    <tr key={id} style={{ borderBottom: "1px solid #1e293b" }}>
                      <td style={tdStyle}>{i + 1}</td>

                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {v.thumbnail ? (
                            <img
                              src={v.thumbnail}
                              alt={v.title}
                              style={{ width: "96px", height: "54px", objectFit: "cover", borderRadius: "10px" }}
                            />
                          ) : null}

                          <div>
                            <div style={{ fontWeight: 800, color: "#fff" }}>{v.title}</div>
                            {v.url ? (
                              <a href={v.url} target="_blank" style={{ color: "#22c55e", fontSize: "12px" }}>
                                Buka di YouTube
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td style={tdStyle}>{typeof v.views === "number" ? v.views.toLocaleString("id-ID") : "-"}</td>
                      <td style={tdStyle}>{typeof v.likes === "number" ? v.likes.toLocaleString("id-ID") : "-"}</td>

                      <td style={tdStyle}>
                        <span style={badgeStyle(v.status)}>
                          {v.status || "-"}
                        </span>
                      </td>

                      <td style={tdStyle}>{dateText}</td>

                      <td style={tdStyle}>
                        <button style={optimizeButtonStyle}>Optimize</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: "18px",
  padding: "18px",
};

const panelStyle: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1e293b",
  borderRadius: "22px",
  padding: "22px",
};

const labelStyle: React.CSSProperties = {
  color: "#94a3b8",
  margin: 0,
};

const numberStyle: React.CSSProperties = {
  fontSize: "30px",
  margin: "8px 0 0",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 10px",
  fontSize: "13px",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 10px",
  color: "#cbd5e1",
  verticalAlign: "middle",
};

const optimizeButtonStyle: React.CSSProperties = {
  background: "#22c55e",
  color: "#020617",
  border: "0",
  borderRadius: "10px",
  padding: "9px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

function badgeStyle(status?: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 800,
  };

  if (status === "Published") {
    return {
      ...base,
      background: "rgba(34,197,94,0.16)",
      color: "#86efac",
      border: "1px solid rgba(34,197,94,0.4)",
    };
  }

  if (status === "Scheduled") {
    return {
      ...base,
      background: "rgba(59,130,246,0.16)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,0.4)",
    };
  }

  return {
    ...base,
    background: "rgba(148,163,184,0.14)",
    color: "#cbd5e1",
    border: "1px solid rgba(148,163,184,0.35)",
  };
}
`
);

console.log("Selesai patch Video Optimizer Published + Scheduled.");