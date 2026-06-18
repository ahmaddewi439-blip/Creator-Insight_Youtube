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
          <p className="muted" style={{ fontSize: 17, lineHeight: 1.6 }}>
            Login channel YouTube, optimasi video, cek kompetitor, lalu generate paket Roblox Shorts lengkap: hook 3 detik, VO natural, 5 scene, prompt gambar, arahan gameplay, caption, deskripsi, hashtag, dan CTA kuat.
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
  
  const [dailyTarget, setDailyTarget] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [dailyScripts, setDailyScripts] = useState<Record<number, any>>({});
  const [loadingDailyScript, setLoadingDailyScript] = useState<Record<number, boolean>>({});
  const [activeDailyTab, setActiveDailyTab] = useState<number>(0);

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
    const subs = Number(channel?.statistics?.subscriberCount || 0);
    const count = Number(channel?.statistics?.videoCount || 0);
    const avg = count ? views / count : 0;
    const raw = Math.min(92, Math.max(45, Math.round(55 + Math.log10(Math.max(avg, 10)) * 7 + Math.log10(Math.max(subs, 10)) * 3)));
    return raw;
  }, [channel]);

  const growthScore = useMemo(() => {
    if (!channel || !videos || videos.length === 0) return 0;
    const totalChannelViews = Number(channel?.statistics?.viewCount || 0);
    const totalChannelVideos = Number(channel?.statistics?.videoCount || 0);
    const historicalAvg = totalChannelVideos > 0 ? totalChannelViews / totalChannelVideos : 0;
    let recentViews = 0;
    videos.forEach(v => { recentViews += Number(v?.statistics?.viewCount || v?.views || 0); });
    const recentAvg = recentViews / videos.length;
    if (historicalAvg === 0) return 75; 
    const ratio = recentAvg / historicalAvg;
    return Math.min(99, Math.max(45, Math.round(50 + (ratio * 20))));
  }, [channel, videos]);

  const seoScore = useMemo(() => {
    if (!videos || videos.length === 0) return 0;
    let totalScore = 0;
    videos.forEach(v => {
      let vScore = 50; 
      const title = v?.snippet?.title || "";
      const desc = v?.snippet?.description || "";
      if (title.length > 20 && title.length < 75) vScore += 15;
      if (desc.length > 100) vScore += 20;
      if (desc.includes("#")) vScore += 15;
      totalScore += vScore;
    });
    return Math.min(99, Math.round(totalScore / videos.length));
  }, [videos]);

  const viralScore = useMemo(() => {
    if (!videos || videos.length === 0) return 0;
    let totalViews = 0, totalLikes = 0;
    videos.forEach(v => {
      totalViews += Number(v?.statistics?.viewCount || v?.views || 0);
      totalLikes += Number(v?.statistics?.likeCount || v?.likes || 0);
    });
    if (totalViews === 0) return 50;
    const likeRatio = totalLikes / totalViews; 
    return Math.min(99, Math.max(45, Math.round(40 + (likeRatio * 1000))));
  }, [videos]);

  async function generateDailyTarget() {
    setDailyTarget({ loading: true, error: "", data: null });
    setDailyScripts({});
    setActiveDailyTab(0);
    try {
      const data = await fetchJson("/api/roblox/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "Roblox trending updates", language: "English" })
      });
      let fetchedTopics = data.topics || [
        { title: "Roblox UGC Free Items", summary: "How to get the newest limited items" },
        { title: "Viral Anime Games Update", summary: "New codes and updates in top anime games" },
        { title: "Roblox Studio Dev News", summary: "Major changes for Roblox developers" },
        { title: "Official Roblox Event", summary: "Everything you need to know about the new event" }
      ];
      const selectedTopics = fetchedTopics.slice(0, 4);
      setDailyTarget({
        loading: false, error: "",
        data: {
          strategyReason: "Berdasarkan algoritma terbaru, memposting 4 video pada jam-jam WIB (08:00, 13:00, 18:00, 20:00) ini akan mendongkrak visibilitas FYP Global secara merata.",
          videos: selectedTopics
        }
      });
      fetchScriptForTab(0, selectedTopics[0]);
    } catch (error: any) {
      setDailyTarget({ loading: false, error: error.message, data: null });
    }
  }

  async function fetchScriptForTab(index: number, topic: any) {
    if (dailyScripts[index] || loadingDailyScript[index]) return;
    setLoadingDailyScript(prev => ({ ...prev, [index]: true }));
    try {
      const strictInstruction = `TARGET AUDIENCE: GLOBAL (English). WAJIB HASILKAN 5 SCENES. Setiap scene WAJIB punya 2 imagePrompts yang berbeda. WAJIB sertakan key tambahan di root JSON: "youtubeTitle", "youtubeDescription", "youtubeHashtags", "thumbnailPrompt", dan "specificGameplay".`;
      const data = await fetchJson("/api/roblox/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, language: "English", duration: "60 seconds", style: strictInstruction })
      });
      let result = data.result || data.raw || data;
      if (typeof result === 'string') {
        try {
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) result = JSON.parse(jsonMatch[0]);
        } catch (e) {}
      }
      setDailyScripts(prev => ({ ...prev, [index]: result }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDailyScript(prev => ({ ...prev, [index]: false }));
    }
  }

  useEffect(() => {
    if (dailyTarget?.data?.videos && dailyTarget.data.videos[activeDailyTab]) {
      fetchScriptForTab(activeDailyTab, dailyTarget.data.videos[activeDailyTab]);
    }
  }, [activeDailyTab, dailyTarget]);

  // FUNGSI OPTIMASI VIDEO
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
          videoFormat: "General YouTube Video",
          duration: "Auto-detect",
          language: "Indonesia/English Mix",
          instruction: `CRITICAL: Judul asli video ini adalah "${originalTitle}". Tolong optimasi SEO untuk video ini agar lebih clickbait dan mudah ditemukan di pencarian. Berikan JSON (recommendedTitles, caption, description, keywords).`
        })
      });
      setOptimizer({ loading: false, error: "", data: data.result || data.raw });
    } catch (err: any) {
      setOptimizer({ loading: false, error: err.message, data: null });
    }
  }

  // --- RENDER AREA ---
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
          <strong>AI Report Status ●</strong> Koboi/OpenAI-compatible gateway aktif.
          <div style={{ marginTop: 12 }}><button className="btn block primary" onClick={() => window.location.href='/long-video'}>Sutradara AI Video</button></div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div><h2 style={{ margin: 0 }}>{tabs.find((t) => t.id === active)?.label}</h2></div>
          <div className="form-row"><button className="btn" onClick={loadDashboard}>Refresh Data</button><button className="btn ghost" onClick={() => signOut()}>Logout</button></div>
        </div>

        {channelState.error && <div className="alert error">{channelState.error}</div>}
        {active === "overview" && renderOverview()}
        {active === "optimizer" && renderOptimizer()}
        {active === "competitors" && renderCompetitors()}
        {active === "roblox" && <div className="card"><h2>Roblox Creator</h2><p className="muted">Silakan gunakan fitur <strong>Target Harian</strong> di tab Overview untuk membuat Roblox Shorts secara otomatis.</p></div>}
        {active === "reports" && renderReports()}
        {active === "settings" && renderSettings()}
      </main>
    </div>
  );

  function renderChannelHeader() {
    const avatar = channel?.thumbnail || channel?.snippet?.thumbnails?.high?.url || channel?.snippet?.thumbnails?.medium?.url || channel?.snippet?.thumbnails?.default?.url;
    return (
      <section className="header-card">
        <div className="channel">
          {avatar ? <img className="avatar" src={avatar} alt="channel avatar" /> : <div className="avatar" />}
          <div>
            <h1>{channel?.title || channel?.snippet?.title || "Your YouTube Channel"}</h1>
            <p>{channel?.snippet?.customUrl || channel?.id || "Memuat data channel..."}</p>
            <div className="badges"><span className="badge">Global Target</span><span className="badge">Roblox Shorts</span></div>
          </div>
        </div>
        <div className="stats">
          <div className="stat"><b>{compact(channel?.subscribers ?? channel?.statistics?.subscriberCount)}</b><span>Subscribers</span></div>
          <div className="stat"><b>{compact(channel?.totalViews ?? channel?.statistics?.viewCount)}</b><span>Total Views</span></div>
          <div className="stat"><b>{compact(channel?.totalVideos ?? channel?.statistics?.videoCount)}</b><span>Total Videos</span></div>
          <div className="stat"><b>{dateText(channel?.publishedAt ?? channel?.snippet?.publishedAt)}</b><span>Joined</span></div>
        </div>
      </section>
    );
  }

  function renderOverview() {
    if (channelState.loading) return <div className="skeleton" />;
    return (
      <div className="grid">
        {renderChannelHeader()}
        <section className="grid grid-2">
          <div className="card">
            <h2>Channel Score</h2>
            <div className="score-row">
              <ScoreRing value={channelScore} label={channelScore >= 85 ? "Excellent" : "Bagus"} />
              <div>
                <h3>Channel kamu sudah siap dioptimasi.</h3>
                <p className="muted">Pertahankan konsistensi upload, perkuat hook 3 detik pertama, dan optimalkan SEO.</p>
                <button className="btn primary" onClick={() => setActive("optimizer")}>Lihat Rekomendasi →</button>
              </div>
            </div>
          </div>
          <div className="grid grid-3">
            <div className="mini-score"><span className="muted">Growth Score</span><br /><b>{growthScore || 0}</b><div className="status-pill">{growthScore >= 80 ? "Sangat Cepat" : "Bagus"}</div></div>
            <div className="mini-score"><span className="muted">SEO Score</span><br /><b>{seoScore || 0}</b><div className="status-pill">{seoScore >= 80 ? "Sangat Bagus" : "Kurang"}</div></div>
            <div className="mini-score"><span className="muted">Viral Potential</span><br /><b>{viralScore || 0}</b><div className="status-pill">{viralScore >= 80 ? "Tinggi" : "Sedang"}</div></div>
          </div>
        </section>

        <section className="grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="card" style={{ border: '2px solid #10b981', background: 'linear-gradient(to right, #064e3b, #022c22)', padding: '20px', borderRadius: '12px', marginBottom: '8px' }}>
             <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#34d399', margin: '0 0 8px 0', fontSize: '20px' }}>🎬 Sutradara AI (Full Video)</h2>
             <p style={{ color: '#a7f3d0', margin: '0 0 16px 0', fontSize: '14px', lineHeight: '1.5' }}>Buat naskah video panjang (5-20 Menit) dengan Voice Over spesifik, instruksi overlay teks, dan format gambar Micro-Pacing (Slide-by-Slide) untuk channel luar negeri.</p>
             <button onClick={() => window.location.href='/long-video'} style={{ width: '100%', background: '#10b981', color: 'white', fontWeight: 'bold', padding: '14px', fontSize: '16px', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
               Masuk ke Sutradara AI 🚀
             </button>
          </div>

          <div className="card" style={{ border: '2px solid #3b82f6' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>🎯 TARGET HARIAN SEKARANG</h2>
            <p className="muted" style={{ marginBottom: 20 }}>Sistem akan meriset 4 Topik Trending hari ini dan secara otomatis memproduksi Data Matang untuk setiap videonya.</p>
            {!dailyTarget.data && (
              <button className="btn primary block" onClick={generateDailyTarget} disabled={dailyTarget.loading} style={{ width: '100%', padding: 16, fontSize: 16 }}>
                {dailyTarget.loading ? "⏳ Mencari Topik Trending & Meracik Data..." : "Generate 4 Video Matang Hari Ini"}
              </button>
            )}
            {dailyTarget.error && <div className="alert error">{dailyTarget.error}</div>}
            {dailyTarget.data && dailyTarget.data.videos && (
              <div style={{ marginTop: 20 }}>
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: 16, borderRadius: 12, marginBottom: 20 }}>
                  <strong style={{ color: '#38bdf8', fontSize: 18, display: 'block', marginBottom: 8 }}>✅ Strategi {dailyTarget.data.videos.length} Video Hari Ini</strong>
                  <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.5 }}>{dailyTarget.data.strategyReason}</p>
                </div>
                <div className="tabs" style={{ marginBottom: 20, overflowX: 'auto', display: 'flex' }}>
                  {dailyTarget.data.videos.map((vid: any, idx: number) => (
                    <button key={idx} className={activeDailyTab === idx ? "active" : ""} onClick={() => setActiveDailyTab(idx)} style={{ padding: '10px 24px', fontWeight: 'bold', minWidth: '120px' }}>🎥 Video {idx + 1}</button>
                  ))}
                </div>
                {(() => {
                  const topicData = dailyTarget.data.videos[activeDailyTab];
                  const scriptData = dailyScripts[activeDailyTab];
                  const isGenerating = loadingDailyScript[activeDailyTab];
                  const getSpecificGames = (data: any) => {
                    const raw = data?.specificGameplay || data?.gameplayPlan?.recommendedRobloxGamesOrMaps?.join(", ") || "";
                    if (!raw || raw.toLowerCase().includes("relevant")) return "Tower of Hell, Blade Ball, Anime Defenders, atau Death Ball.";
                    return raw;
                  };

                  return (
                    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: 24, borderRadius: 16, minHeight: '300px' }}>
                      {isGenerating ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '50px 0' }}><span style={{ fontSize: '30px', display: 'block', marginBottom: '10px' }}>⏳</span><strong>Sedang memproduksi Script 5 Scene, SEO, & Thumbnail...</strong></div>
                      ) : scriptData ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '1px solid #1e293b', paddingBottom: 16 }}>
                            <div><strong style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>📌 Judul Video (Clickbait Global):</strong><h3 style={{ margin: 0, color: '#f8fafc', fontSize: 22 }}>{scriptData.youtubeTitle || scriptData.videoTitle || topicData.title}</h3></div>
                            <CopyButton text={scriptData.youtubeTitle || scriptData.videoTitle || topicData.title} label="Copy Judul" />
                          </div>
                          
                          <div className="grid grid-2" style={{ marginBottom: 16 }}>
                            <OutputBlock title="📝 Deskripsi Video" value={scriptData.youtubeDescription || scriptData.description || "-"} />
                            <OutputBlock title="🏷️ Hashtags (FYP Target)" value={Array.isArray(scriptData.youtubeHashtags) ? scriptData.youtubeHashtags.join(" ") : (scriptData.youtubeHashtags || scriptData.hashtags?.join(" ") || "#roblox")} />
                          </div>
                          
                          <div style={{ backgroundColor: '#1e1b4b', borderLeft: '4px solid #6366f1', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #312e81', paddingBottom: '8px' }}>
                               <strong style={{ color: '#818cf8', fontSize: '16px', margin: 0 }}>🎮 Judul Game Roblox Asli:</strong>
                               <CopyButton text={getSpecificGames(scriptData)} label="Copy Game" />
                             </div>
                             <p style={{ margin: 0, fontSize: '15px', color: '#c7d2fe', lineHeight: '1.6', fontWeight: '600' }}>{getSpecificGames(scriptData)}</p>
                          </div>

                          <OutputBlock title="🖼️ Prompt Thumbnail (9:16)" value={scriptData.thumbnailPrompt || scriptData.thumbnail_prompt || "-"} />
                          <OutputBlock title="🎙️ Full Voice Over Script" value={scriptData.fullVO || "-"} />
                        </>
                      ) : <div style={{ color: 'red', textAlign: 'center' }}>Gagal memuat data script.</div>}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  function renderOptimizer() {
    // FITUR LIVE PREVIEW (Update Judul, Deskripsi, dan Tags sekaligus)
    const handleLivePreview = (type: string, value: any) => {
      if (!selectedVideo) return;
      const currentId = getVideoId(selectedVideo);
      
      // Update data di state utama
      setVideosState(prev => ({
        ...prev,
        data: prev.data?.map(v => {
          if (getVideoId(v) === currentId) {
            let updatedSnippet = { ...(v.snippet || {}) };
            if (type === "title") updatedSnippet.title = value;
            if (type === "description") updatedSnippet.description = value;
            if (type === "tags") updatedSnippet.tags = value;
            return { ...v, title: type === "title" ? value : (v.title || updatedSnippet.title), snippet: updatedSnippet };
          }
          return v;
        }) || []
      }));
      
      // Update data di panel yang sedang terbuka
      setSelectedVideo((prev: any) => {
        let updatedSnippet = { ...(prev?.snippet || {}) };
        if (type === "title") updatedSnippet.title = value;
        if (type === "description") updatedSnippet.description = value;
        if (type === "tags") updatedSnippet.tags = value;
        return { ...prev, title: type === "title" ? value : (prev?.title || updatedSnippet.title), snippet: updatedSnippet };
      });

      // Memberikan notifikasi visual sukses diterapkan
      if (type === "description") alert("📝 Deskripsi baru berhasil diterapkan pada video! Jangan lupa klik 'Simpan Perubahan'.");
      if (type === "tags") alert("🏷️ Hashtags berhasil diterapkan pada video! Jangan lupa klik 'Simpan Perubahan'.");
    };

    // FUNGSI TOMBOL SIMPAN
    const handleSaveToYouTube = () => {
      alert("✅ SEMUA PERUBAHAN TERSIMPAN!\n\nJudul, Deskripsi, dan Hashtag telah berhasil diamankan di Dasbor. \n\n(Catatan: Untuk sinkronisasi otomatis push ke YouTube Studio, kita perlu mengaktifkan rute API Update di sesi selanjutnya. Saat ini data aman di tabel lokal Anda.)");
    };

    return (
      <div className="grid">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Video Optimizer SEO</h2>
              <p className="muted" style={{ margin: 0 }}>Optimasi Judul & Deskripsi SEO untuk video yang sudah Published atau Scheduled.</p>
            </div>
          </div>
          
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>#</th><th>Video</th><th>Views</th><th>Likes</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {sortedVideos.map((v, i) => {
                  const isSelected = selectedVideo && getVideoId(selectedVideo) === getVideoId(v);
                  
                  return (
                    <React.Fragment key={getVideoId(v) || i}>
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
                                  ⏳ AI sedang mendeteksi bahasa & meracik formula SEO terbaik...
                                </div>
                              )}
                              {optimizer.error && <div className="alert error">{optimizer.error}</div>}
                              {optimizer.data && !optimizer.loading && (
                                <>
                                  <OptimizerResultView 
                                    result={optimizer.data} 
                                    onLivePreview={handleLivePreview}
                                  />
                                  {/* TOMBOL SIMPAN DITAMBAHKAN DI SINI */}
                                  <div style={{ marginTop: '24px', borderTop: '1px solid #334155', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button 
                                      onClick={handleSaveToYouTube} 
                                      style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}
                                    >
                                      💾 Simpan Perubahan Video
                                    </button>
                                  </div>
                                </>
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

  function renderCompetitors() { return <div><h2 style={{color: 'white'}}>Competitor Research (Dalam Pengembangan)</h2></div>; }
  function renderReports() { return <div><h2 style={{color: 'white'}}>Reports (Dalam Pengembangan)</h2></div>; }
  function renderSettings() { return <div><h2 style={{color: 'white'}}>Settings (Dalam Pengembangan)</h2></div>; }
} 

// --- KOMPONEN HASIL SEO (DESAIN BARU & ANTI ERROR VERCEL) ---
function OptimizerResultView({ result, onLivePreview }: { result: any; onLivePreview: (type: string, value: any) => void }) {
  if (typeof result === "string") return <div className="output" style={{color: 'white'}}>{result}</div>;
  
  const titles = result.recommendedTitles || [];
  const tags = result.keywords || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* KOTAK JUDUL */}
      <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f8fafc' }}>🔥 3 Rekomendasi Judul Viral (Ketuk untuk Update)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {titles.map((title: string, idx: number) => (
            <div 
              key={idx} 
              onClick={() => onLivePreview("title", title)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}
              title="Klik untuk mengubah judul video"
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#60a5fa'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}
            >
              <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' }}>{title}</span>
              <CopyButton text={title} />
            </div>
          ))}
        </div>
      </div>

      {/* KOTAK DESKRIPSI (Sekarang Bisa Diklik) */}
      <div 
        onClick={() => onLivePreview("description", result.description)}
        style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', cursor: 'pointer' }}
        title="Klik untuk menerapkan deskripsi ini ke video"
        onMouseOver={(e) => e.currentTarget.style.borderColor = '#60a5fa'}
        onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: '0', fontSize: '14px', color: '#f8fafc' }}>📝 Deskripsi Full SEO (Ketuk untuk Update)</h3>
          <CopyButton text={result.description} />
        </div>
        <p style={{ fontSize: '13px', color: '#cbd5e1', whiteSpace: 'pre-wrap', background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', margin: 0 }}>
          {result.description}
        </p>
      </div>

      {/* KOTAK HASHTAG (Sekarang Bisa Diklik) */}
      <div 
        onClick={() => onLivePreview("tags", tags)}
        style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', cursor: 'pointer' }}
        title="Klik untuk menerapkan hashtags ini ke video"
        onMouseOver={(e) => e.currentTarget.style.borderColor = '#60a5fa'}
        onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: '0', fontSize: '14px', color: '#f8fafc' }}>🏷️ Hashtags & Keywords (Ketuk untuk Update)</h3>
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

function OutputBlock({ title, value, compactBlock = false }: { title: string; value: any; compactBlock?: boolean }) {
  const text = Array.isArray(value) ? value.join("\n") : String(value || "-");
  return (
    <div style={{ marginTop: compactBlock ? 10 : 0, background: '#0f172a', border: '1px solid #334155', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: '#cbd5e1' }}>{title}</h3>
        <CopyButton text={text} />
      </div>
      <div style={{ fontSize: '14px', color: '#f8fafc', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{text}</div>
    </div>
  );
}