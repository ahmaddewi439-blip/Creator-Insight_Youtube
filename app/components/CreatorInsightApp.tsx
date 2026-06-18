"use client";

import React, { useEffect, useMemo, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

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
      <td><span className={privacy === "public" ? "status-pill" : (privacy === "scheduled" ? "status-pill yellow" : "status-pill red")}>{privacy}</span></td>
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
          <div className="form-row" style={{ marginTop: 22 }}>
            <button className="btn primary" onClick={() => signIn("google")}>Login Channel YouTube</button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CreatorInsightApp() {
  const { data: session, status } = useSession();
  const [active, setActive] = useState<TabId>("overview");
  const [channelState, setChannelState] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [videosState, setVideosState] = useState<ApiState<any[]>>({ loading: false, error: "", data: [] });
  
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [optimizer, setOptimizer] = useState<ApiState<any>>({ loading: false, error: "", data: null });

  useEffect(() => {
    if (status !== "authenticated") return;
    loadDashboard();
  }, [status]);

  async function loadDashboard() {
    setChannelState({ loading: true, error: "", data: null });
    setVideosState({ loading: true, error: "", data: [] });
    try {
      const [channelRes, videosRes] = await Promise.all([
        fetchJson("/api/youtube/channel"),
        fetchJson("/api/youtube/channel-videos")
      ]);
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
    const count = Number(channel?.statistics?.videoCount || 0);
    return count ? Math.min(92, Math.max(45, Math.round(55 + Math.log10(Math.max(views/count, 10)) * 7))) : 0;
  }, [channel]);

  // FUNGSI OPTIMASI YANG SUDAH DIPERBAIKI
  async function optimizeVideo(video: any) {
    // Memastikan hanya video yang diklik yang diset
    setSelectedVideo(video);
    setOptimizer({ loading: true, error: "", data: null });
    
    try {
      const data = await fetchJson("/api/ai/optimize-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video })
      });
      if (data.error) throw new Error(data.error);
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
            <button key={tab.id} className={active === tab.id ? "active" : ""} onClick={() => setActive(tab.id)}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </nav>
        <div className="side-card">
          <div style={{ marginTop: 12 }}><button className="btn block primary" onClick={() => window.location.href='/long-video'}>Sutradara AI Video</button></div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div><h2 style={{ margin: 0 }}>{tabs.find((t) => t.id === active)?.label}</h2></div>
          <div className="form-row"><button className="btn" onClick={loadDashboard}>Refresh Data</button><button className="btn ghost" onClick={() => signOut()}>Logout</button></div>
        </div>
        
        {active === "overview" && renderOverview()}
        {active === "optimizer" && renderOptimizer()}
      </main>
    </div>
  );

  function renderOverview() {
    return (
      <div className="grid">
        <section className="grid grid-2">
          <div className="card">
            <h2>Channel Score</h2>
            <div className="score-row">
              <ScoreRing value={channelScore} label={channelScore >= 85 ? "Excellent" : "Bagus"} />
              <div>
                <h3>Channel kamu sudah siap dioptimasi.</h3>
                <button className="btn primary" onClick={() => setActive("optimizer")}>Lihat Video Terjadwal →</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderOptimizer() {
    return (
      <div className="grid">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Video Optimizer SEO</h2>
              <p className="muted" style={{ margin: 0 }}>Hasilkan Judul, Deskripsi, dan Hashtag berdaya ledak algoritma untuk mendongkrak distribusi video Anda.</p>
            </div>
          </div>
          
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>#</th><th>Video</th><th>Views</th><th>Likes</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {sortedVideos.map((v, i) => {
                  // PERBAIKAN LOGIKA: Membandingkan secara langsung objek videonya (100% akurat)
                  const isSelected = selectedVideo === v; 
                  
                  return (
                    <React.Fragment key={i}>
                      <VideoRow video={v} index={i} onSelect={optimizeVideo} />
                      {isSelected && (
                        <tr>
                          <td colSpan={6} style={{ padding: 0, backgroundColor: '#0f172a' }}>
                            <div style={{ width: '100%', boxSizing: 'border-box', borderTop: '2px solid #3b82f6', borderBottom: '2px solid #3b82f6', padding: '16px', margin: '16px 0', borderRadius: '8px' }}>
                              <h2 style={{ marginTop: 0, color: '#60a5fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>⚙️ Panel Optimasi AI SEO</span>
                                <button className="btn ghost" onClick={() => setSelectedVideo(null)} style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#1e293b', color: '#cbd5e1', border: 'none', borderRadius: '4px' }}>Tutup</button>
                              </h2>
                              {optimizer.loading && (
                                <div style={{ padding: '40px 0', textAlign: 'center', color: '#3b82f6' }}>
                                  ⏳ AI sedang meracik formula SEO terbaik untuk video ini...
                                </div>
                              )}
                              {optimizer.error && <div className="alert error">{optimizer.error}</div>}
                              {optimizer.data && !optimizer.loading && (
                                <OptimizerResultView result={optimizer.data} />
                              )}
                            </div>
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

function OptimizerResultView({ result }: { result: any }) {
  if (typeof result === "string") return <div className="output" style={{color: 'white'}}>{result}</div>;
  
  const titles = result.recommendedTitles || [];
  const tags = result.keywords || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f8fafc' }}>🔥 3 Rekomendasi Judul Viral (Clickbait namun Akurat)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {titles.map((title: string, idx: number) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' }}>{title}</span>
              <CopyButton text={title} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#f8fafc' }}>📝 Deskripsi Full SEO (Hooks Algorithm)</h3>
          <CopyButton text={result.description} />
        </div>
        <p style={{ fontSize: '13px', color: '#cbd5e1', whiteSpace: 'pre-wrap', background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
          {result.description}
        </p>
      </div>

      <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#f8fafc' }}>🏷️ Hashtags & Keywords (Copy & Paste ke Kolom Tag)</h3>
          <CopyButton text={tags.join(", ")} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {tags.map((tag: string, i: number) => (
            <span key={i} style={{ background: '#0f172a', color: '#60a5fa', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', border: '1px solid #1e3a8a' }}>
              #{tag.replace(/\s+/g, '')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}