"use client";

import React, { useEffect, useMemo, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import RobloxCreatorFinalUI from "../../src/components/RobloxCreatorFinalUI";

type TabId = "overview" | "optimizer" | "competitors" | "roblox" | "reports" | "settings";

type ApiState<T> = {
  loading: boolean;
  error: string;
  data: T | null;
};

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "optimizer", label: "Video Optimizer", icon: "▶️" },
  { id: "competitors", label: "Competitors", icon: "👥" },
  { id: "roblox", label: "Roblox Creator", icon: "🎮" },
  { id: "reports", label: "Reports", icon: "📄" },
  { id: "settings", label: "Settings", icon: "⚙️" }
];

function compact(value?: string | number) {
  const n = typeof value === "string" ? Number(value) : value || 0;
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function fullNumber(value?: string | number) {
  const n = typeof value === "string" ? Number(value) : value || 0;
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("en").format(n);
}

function dateText(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });
}

async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await navigator.clipboard.writeText(text || "");
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
      style={{
        background: done ? '#10b981' : '#3b82f6',
        color: '#ffffff',
        border: 'none',
        padding: '6px 14px',
        borderRadius: '8px',
        fontSize: '13px',
        cursor: 'pointer',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s',
        flexShrink: 0
      }}
    >
      {done ? "✓ Berhasil Copy!" : `📋 ${label}`}
    </button>
  );
}

function ScoreRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="ring" style={{ ["--score" as any]: value }}>
      <div className="ring-content">
        <b>{value}</b>
        <span>/100</span>
        <div className="status-pill" style={{ marginTop: 8 }}>{label}</div>
      </div>
    </div>
  );
}

function VideoRow({ video, index, onSelect }: { video: any; index: number; onSelect?: (video: any) => void }) {
  const thumb = video?.thumbnail || video?.snippet?.thumbnails?.medium?.url || video?.snippet?.thumbnails?.default?.url;
  const privacy = video?.status?.privacyStatus || video?.privacyStatus || (typeof video?.status === "string" ? video.status : "Published");
  return (
    <tr>
      <td>{index + 1}</td>
      <td>
        <div className="video-cell">
          {thumb && <img src={thumb} className="thumb" alt="thumbnail" />}
          <div>
            <strong>{video?.title || video?.snippet?.title || "Untitled"}</strong>
            <div className="muted small">{dateText(video?.publishedAt || video?.publishAt || video?.snippet?.publishedAt)}</div>
          </div>
        </div>
      </td>
      <td>{compact(video?.views ?? video?.statistics?.viewCount)}</td>
      <td>{compact(video?.likes ?? video?.statistics?.likeCount)}</td>
      <td><span className={privacy === "public" ? "status-pill" : "status-pill yellow"}>{privacy}</span></td>
      {onSelect && <td><button className="btn" onClick={() => onSelect(video)}>Optimize</button></td>}
    </tr>
  );
}

function LoginScreen() {
  return (
    <main className="login-wrap">
      <section className="login-card">
        <div>
          <div className="logo" style={{ marginBottom: 18 }}>
            <div className="logo-badge">▶</div>
            <div>Creator Insight<small>YouTube Analyzer + Roblox Shorts Creator</small></div>
          </div>
          <h1>Tool pribadi untuk analisis YouTube dan membuat Roblox Shorts.</h1>
          <p className="muted" style={{ fontSize: 17, lineHeight: 1.6 }}>
            Login channel YouTube, optimasi video, cek kompetitor, lalu generate paket Roblox Shorts lengkap: hook 3 detik, VO natural, 5 scene, prompt gambar, arahan gameplay, dll.
          </p>
          <div className="form-row" style={{ marginTop: 22 }}>
            <button className="btn primary" onClick={() => signIn("google")}>Login Channel YouTube</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function getVideoId(video: any) {
  if (!video) return "";
  if (typeof video.id === "string") return video.id;
  return video.id?.videoId || video.videoId || "";
}

export default function CreatorInsightApp() {
  const { data: session, status } = useSession();
  const [active, setActive] = useState<TabId>("overview");
  const [channelState, setChannelState] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [videosState, setVideosState] = useState<ApiState<any[]>>({ loading: false, error: "", data: [] });
  
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [optimizer, setOptimizer] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [selectedVideoFormat, setSelectedVideoFormat] = useState("Shorts");
  const [videoDuration, setVideoDuration] = useState("10");
  const [videoLanguage, setVideoLanguage] = useState("English");

  const [competitorQuery, setCompetitorQuery] = useState("");
  const [competitors, setCompetitors] = useState<ApiState<any[]>>({ loading: false, error: "", data: [] });
  const [competitorVideos, setCompetitorVideos] = useState<ApiState<any>>({ loading: false, error: "", data: null });

  const [dailyTarget, setDailyTarget] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [dailyScripts, setDailyScripts] = useState<Record<number, any>>({});
  const [loadingDailyScript, setLoadingDailyScript] = useState<Record<number, boolean>>({});
  const [activeDailyTab, setActiveDailyTab] = useState<number>(0);
  const uploadTimes = ["08:00 WIB", "13:00 WIB", "18:00 WIB", "20:00 WIB"];

  useEffect(() => {
    if (status !== "authenticated") return;
    loadDashboard();
  }, [status]);

  async function loadDashboard() {
    setChannelState({ loading: true, error: "", data: null });
    setVideosState({ loading: true, error: "", data: [] });
    try {
      const [channelRes, videosRes] = await Promise.all([fetchJson("/api/youtube/channel"), fetchJson("/api/youtube/channel-videos")]);
      setChannelState({ loading: false, error: "", data: channelRes.channel || channelRes });
      setVideosState({ loading: false, error: "", data: Array.isArray(videosRes) ? videosRes : videosRes.videos || [] });
    } catch (err: any) {
      setChannelState({ loading: false, error: err.message, data: null });
      setVideosState({ loading: false, error: err.message, data: [] });
    }
  }

  const channel = channelState.data;
  const videos = videosState.data || [];
  const sortedVideos = useMemo(() => [...videos].sort((a, b) => Number(b?.statistics?.viewCount || 0) - Number(a?.statistics?.viewCount || 0)), [videos]);
  
  const channelScore = useMemo(() => {
    const views = Number(channel?.statistics?.viewCount || 0);
    const subs = Number(channel?.statistics?.subscriberCount || 0);
    const count = Number(channel?.statistics?.videoCount || 0);
    const avg = count ? views / count : 0;
    const raw = Math.min(92, Math.max(45, Math.round(55 + Math.log10(Math.max(avg, 10)) * 7 + Math.log10(Math.max(subs, 10)) * 3)));
    return raw;
  }, [channel]);

  async function optimizeVideo(video: any) {
    setSelectedVideo(video);
    setOptimizer({ loading: true, error: "", data: null });
    try {
      const originalTitle = video?.snippet?.title || video?.title || "";
      const data = await fetchJson("/api/ai/optimize-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          video,
          videoFormat: selectedVideoFormat,
          duration: selectedVideoFormat === "Long" ? `${videoDuration} minutes` : "Shorts",
          language: videoLanguage,
          instruction: `Judul asli: "${originalTitle}". Format: ${selectedVideoFormat}. Durasi: ${selectedVideoFormat === "Long" ? `${videoDuration} minutes` : "Shorts"}. Bahasa: ${videoLanguage}.`
        })
      });
      setOptimizer({ loading: false, error: "", data: data.result || data.raw });
    } catch (err: any) {
      setOptimizer({ loading: false, error: err.message, data: null });
    }
  }

  if (status === "loading") return <div className="login-wrap"><div className="skeleton" style={{ width: 380 }} /></div>;
  if (!session) return <LoginScreen />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo"><div className="logo-badge">▶</div><div>Creator Insight<small>YouTube Analyzer</small></div></div>
        <nav className="menu">
          {tabs.map((tab) => (
            <button key={tab.id} className={active === tab.id ? "active" : ""} onClick={() => setActive(tab.id)}><span>{tab.icon}</span>{tab.label}</button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <div><h2 style={{ margin: 0 }}>{tabs.find((t) => t.id === active)?.label}</h2></div>
        </div>

        {active === "overview" && (
            <div className="grid">
              <section className="header-card">
                 <div className="channel"><div><h1>{channel?.snippet?.title || "Your Channel"}</h1></div></div>
              </section>
            </div>
        )}
        
        {active === "optimizer" && renderOptimizer()}
        {active === "roblox" && <RobloxCreatorFinalUI />}
      </main>
    </div>
  );

  function renderOptimizer() {
    return (
      <div className="grid">
        <div className="card">
          <h2>Video Optimizer (Shorts & Long Video)</h2>
          <div className="form-row" style={{ marginTop: 18, marginBottom: 18, backgroundColor: '#f0f4f9', padding: 16, borderRadius: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '15px', fontWeight: 'bold' }}>
              Format Target AI:
              <select className="select" style={{ padding: '12px 18px', fontSize: '14px', borderRadius: '8px' }} value={selectedVideoFormat} onChange={(e) => setSelectedVideoFormat(e.target.value)}>
                <option value="Shorts">YouTube Shorts (Vertikal)</option>
                <option value="Long">Video Panjang (SEO + Storytelling)</option>
              </select>

              {selectedVideoFormat === "Long" && (
                <div>
                  <label>Durasi Video</label>
                  <select className="select" style={{ padding: '12px 18px', fontSize: '14px', borderRadius: '8px', width: '100%', marginTop: '5px' }} value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)}>
                    <option value="5">5 Menit</option>
                    <option value="10">10 Menit</option>
                    <option value="15">15 Menit</option>
                    <option value="20">20 Menit</option>
                  </select>
                </div>
              )}

              <div>
                <label>Bahasa</label>
                <select className="select" style={{ padding: '12px 18px', fontSize: '14px', borderRadius: '8px', width: '100%', marginTop: '5px' }} value={videoLanguage} onChange={(e) => setVideoLanguage(e.target.value)}>
                  <option value="Indonesia">Indonesia</option>
                  <option value="English">English</option>
                </select>
              </div>
            </label>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>#</th><th>Video</th><th>Views</th><th>Likes</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {sortedVideos.map((v, i) => {
                  const isSelected = selectedVideo && getVideoId(selectedVideo) === getVideoId(v);
                  return (
                    <React.Fragment key={getVideoId(v) || i}>
                      <VideoRow video={v} index={i} onSelect={optimizeVideo} />
                      {isSelected && (
                        <tr>
                          <td colSpan={6} style={{ padding: '16px', backgroundColor: '#f8fafc' }}>
                             {optimizer.loading ? "Sedang memproses AI..." : <pre style={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(optimizer.data, null, 2)}</pre>}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}