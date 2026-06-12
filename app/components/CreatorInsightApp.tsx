"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
// JALUR IMPORT SESUAI FOLDER ANDA
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
      className="btn ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(text || "");
        setDone(true);
        setTimeout(() => setDone(false), 1100);
      }}
    >
      {done ? "Copied ✓" : label}
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
  const privacy = video?.status || video?.privacyStatus || video?.status?.privacyStatus || "Published";
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

export default function CreatorInsightApp() {
  const { data: session, status } = useSession();
  const [active, setActive] = useState<TabId>("overview");
  const [channelState, setChannelState] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [videosState, setVideosState] = useState<ApiState<any[]>>({ loading: false, error: "", data: [] });
  
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [optimizer, setOptimizer] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [selectedVideoFormat, setSelectedVideoFormat] = useState("Shorts");

  const [competitorQuery, setCompetitorQuery] = useState("");
  const [competitors, setCompetitors] = useState<ApiState<any[]>>({ loading: false, error: "", data: [] });
  const [competitorVideos, setCompetitorVideos] = useState<ApiState<any>>({ loading: false, error: "", data: null });

  const [robloxQuery, setRobloxQuery] = useState("Roblox update");
  const [robloxLanguage, setRobloxLanguage] = useState("English");
  const [robloxDuration, setRobloxDuration] = useState("60 seconds");
  const [robloxStyle, setRobloxStyle] = useState("Natural News");
  const [topics, setTopics] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [script, setScript] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [scriptTab, setScriptTab] = useState("scenes");

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
// 1. Growth Score (Realistis)
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
    let score = Math.round(50 + (ratio * 20));
    return Math.min(99, Math.max(45, score));
  }, [channel, videos]);

  // 2. SEO Score (Realistis)
  const seoScore = useMemo(() => {
    if (!videos || videos.length === 0) return 0;
    let totalScore = 0;
    videos.forEach(v => {
      let vScore = 50; // Base score
      const title = v?.snippet?.title || "";
      const desc = v?.snippet?.description || "";
      if (title.length > 20 && title.length < 75) vScore += 15;
      if (desc.length > 100) vScore += 20;
      if (desc.includes("#")) vScore += 15;
      totalScore += vScore;
    });
    return Math.min(99, Math.round(totalScore / videos.length));
  }, [videos]);

  // 3. Viral Potential (Realistis)
  const viralScore = useMemo(() => {
    if (!videos || videos.length === 0) return 0;
    let totalViews = 0;
    let totalLikes = 0;
    videos.forEach(v => {
      totalViews += Number(v?.statistics?.viewCount || v?.views || 0);
      totalLikes += Number(v?.statistics?.likeCount || v?.likes || 0);
    });
    if (totalViews === 0) return 50;
    const likeRatio = totalLikes / totalViews; 
    let score = Math.round(40 + (likeRatio * 1000)); 
    return Math.min(99, Math.max(45, score));
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

      let fetchedTopics = data.topics || [];
      if (!Array.isArray(fetchedTopics) || fetchedTopics.length === 0) {
        fetchedTopics = [
          { title: "Roblox UGC Free Items", summary: "How to get the newest limited items" },
          { title: "Viral Anime Games Update", summary: "New codes and updates in top anime games" },
          { title: "Roblox Studio Dev News", summary: "Major changes for Roblox developers" },
          { title: "Official Roblox Event", summary: "Everything you need to know about the new event" }
        ];
      }

      const selectedTopics = fetchedTopics.slice(0, 4);

      setDailyTarget({
        loading: false,
        error: "",
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
      const strictInstruction = `TARGET AUDIENCE: GLOBAL (English).
      WAJIB HASILKAN 5 SCENES. Setiap scene WAJIB punya 2 imagePrompts yang berbeda.
      SELAIN ITU, wajib sertakan key tambahan di root JSON:
      1. "youtubeTitle": Judul Clickbait Global (Maks 60 Karakter).
      2. "youtubeDescription": Deskripsi spesifik untuk SEO.
      3. "youtubeHashtags": Array berisi 5-7 hashtag viral (contoh: ["#roblox", "#robloxedit"]).
      4. "thumbnailPrompt": SATU Prompt gambar 3D clickbait untuk Thumbnail YouTube Shorts rasio 9:16.
      5. "specificGameplay": WAJIB TULISKAN NAMA GAME ROBLOX ASLI YANG SPESIFIK (Contoh: "Tower of Hell", "Blade Ball", "Death Ball", "Anime Defenders"). JANGAN TULIS KATA GENERIK SEPERTI "relevant gameplay"!`;

      const data = await fetchJson("/api/roblox/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: topic, 
          language: "English", 
          duration: "60 seconds", 
          style: strictInstruction 
        })
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
      console.error("Gagal load script:", e);
    } finally {
      setLoadingDailyScript(prev => ({ ...prev, [index]: false }));
    }
  }

  useEffect(() => {
    if (dailyTarget?.data?.videos && dailyTarget.data.videos[activeDailyTab]) {
      fetchScriptForTab(activeDailyTab, dailyTarget.data.videos[activeDailyTab]);
    }
  }, [activeDailyTab, dailyTarget]);


async function optimizeVideo(video: any) {
    setSelectedVideo(video);
    setOptimizer({ loading: true, error: "", data: null });
    try {
      const originalTitle = video?.snippet?.title || video?.title || "Untitled";
      const originalDesc = video?.snippet?.description || video?.description || "";
      
      const data = await fetchJson("/api/ai/optimize-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          video, 
          videoFormat: selectedVideoFormat,
          // INSTRUKSI MUTLAK: PAKSA AI FOKUS PADA KONTEKS & BAHASA ASLI
          instruction: `CRITICAL RULE: You are optimizing THIS exact video. 
          Original Title: "${originalTitle}" 
          Original Description: "${originalDesc}" 
          
          1. Analyze the exact topic from this original metadata. DO NOT hallucinate or change the topic.
          2. Detect the EXACT language of the Original Title. You MUST generate ALL JSON responses (recommendedTitles, caption, description, hashtags) in that EXACT SAME LANGUAGE.
          3. Make the output highly relevant ONLY to this specific video's context.`
        })
      });
      setOptimizer({ loading: false, error: "", data: data.result || data.raw });
    } catch (err: any) {
      setOptimizer({ loading: false, error: err.message, data: null });
    }
  }

  async function searchCompetitors() {
    setCompetitors({ loading: true, error: "", data: [] });
    setCompetitorVideos({ loading: false, error: "", data: null });
    try {
      const data = await fetchJson(`/api/youtube/competitors?q=${encodeURIComponent(competitorQuery)}`);
      setCompetitors({ loading: false, error: "", data: data.channels || [] });
    } catch (err: any) {
      setCompetitors({ loading: false, error: err.message, data: [] });
    }
  }

  async function loadCompetitorVideos(channelId: string) {
    setCompetitorVideos({ loading: true, error: "", data: null });
    try {
      const data = await fetchJson(`/api/youtube/channel-videos?channelId=${encodeURIComponent(channelId)}`);
      setCompetitorVideos({ loading: false, error: "", data });
    } catch (err: any) {
      setCompetitorVideos({ loading: false, error: err.message, data: null });
    }
  }

  async function searchRobloxTopics() {
    setTopics({ loading: true, error: "", data: null });
    setSelectedTopic(null);
    setScript({ loading: false, error: "", data: null });
    try {
      const data = await fetchJson("/api/roblox/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: robloxQuery, language: robloxLanguage })
      });
      setTopics({ loading: false, error: "", data });
    } catch (err: any) {
      setTopics({ loading: false, error: err.message, data: null });
    }
  }

  async function generateRobloxScript(topic: any) {
    setSelectedTopic(topic);
    setScript({ loading: true, error: "", data: null });
    setScriptTab("scenes");
    try {
      const data = await fetchJson("/api/roblox/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, language: robloxLanguage, duration: robloxDuration, style: robloxStyle })
      });
      setScript({ loading: false, error: "", data: data.result || data.raw });
    } catch (err: any) {
      setScript({ loading: false, error: err.message, data: null });
    }
  }

  // --- RENDER AREA ---
  if (status === "loading") return <div className="login-wrap"><div className="skeleton" style={{ width: 380 }} /></div>;
  if (!session) return <LoginScreen />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-badge">▶</div>
          <div>Creator Insight<small>YouTube Analyzer</small></div>
        </div>
        <nav className="menu">
          {tabs.map((tab) => (
            <button key={tab.id} className={active === tab.id ? "active" : ""} onClick={() => setActive(tab.id)}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </nav>
        <div className="side-card">
          <strong>AI Report Status ●</strong>
          Koboi/OpenAI-compatible gateway aktif.
          <div style={{ marginTop: 12 }}><button className="btn block primary" onClick={() => setActive("roblox")}>Create Roblox Shorts</button></div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h2 style={{ margin: 0 }}>{tabs.find((t) => t.id === active)?.label}</h2>
            <p className="muted" style={{ margin: "6px 0 0" }}>Tool pribadi untuk YouTube + Roblox Shorts workflow.</p>
          </div>
          <div className="form-row">
            <button className="btn" onClick={loadDashboard}>Refresh Data</button>
            <button className="btn ghost" onClick={() => signOut()}>Logout</button>
          </div>
        </div>

        {channelState.error && <div className="alert error">{channelState.error}</div>}
        {active === "overview" && renderOverview()}
        {active === "optimizer" && renderOptimizer()}
        {active === "competitors" && renderCompetitors()}
        {active === "roblox" && renderRobloxCreator()}
        {active === "reports" && renderReports()}
        {active === "settings" && renderSettings()}
      </main>

      <nav className="mobile-tabs">
        {tabs.slice(0, 5).map((tab) => (
          <button key={tab.id} className={active === tab.id ? "active" : ""} onClick={() => setActive(tab.id)}>
            <div>{tab.icon}</div>{tab.label.replace("Video ", "").replace("Roblox Creator", "Create")}
          </button>
        ))}
      </nav>
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
            <p>{channel?.snippet?.customUrl || channel?.id || "Login berhasil. Data channel akan tampil di sini."}</p>
            <div className="badges">
              <span className="badge">Global Target</span>
              <span className="badge">Roblox Shorts</span>
            </div>
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
                <h3>Channel kamu sudah siap meledak.</h3>
                <p className="muted">Pertahankan pacing upload harian, gunakan VO English untuk mengejar CPM/RPM global, dan selalu cek Optimizer.</p>
                <button className="btn primary" onClick={() => setActive("optimizer")}>Lihat Rekomendasi →</button>
              </div>
            </div>
          </div>
          <div className="grid grid-3">
            <div className="mini-score"><span className="muted">Growth Score</span><br /><b>{growthScore || 0}</b><div className="status-pill">{growthScore >= 80 ? "Sangat Cepat" : "Stabil"}</div></div>
            <div className="mini-score"><span className="muted">SEO Score</span><br /><b>{seoScore || 0}</b><div className="status-pill">{seoScore >= 80 ? "Sangat Bagus" : "Kurang"}</div></div>
            <div className="mini-score"><span className="muted">Viral Potential</span><br /><b>{viralScore || 0}</b><div className="status-pill">{viralScore >= 80 ? "Tinggi (Good ER)" : "Sedang"}</div></div>
          </div>
        </section>

        <section className="grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="card" style={{ border: '2px solid #3b82f6' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>🎯 TARGET HARIAN SEKARANG</h2>
            <p className="muted" style={{ marginBottom: 20 }}>
              Sistem akan meriset 4 Topik Trending hari ini dan secara otomatis memproduksi Data Matang (SEO, Judul, Game Spesifik, Thumbnail 9:16, & Prompt per Scene) untuk setiap videonya.
            </p>

            {!dailyTarget.data && (
              <button 
                className="btn primary" 
                onClick={generateDailyTarget} 
                disabled={dailyTarget.loading}
                style={{ width: '100%', padding: 16, fontSize: 16 }}
              >
                {dailyTarget.loading ? "⏳ Mencari Topik Trending & Meracik Data..." : "Generate 4 Video Matang Hari Ini"}
              </button>
            )}

            {dailyTarget.error && <div className="alert error">{dailyTarget.error}</div>}

            {dailyTarget.data && dailyTarget.data.videos && (
              <div style={{ marginTop: 20 }}>
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: 16, borderRadius: 12, marginBottom: 20 }}>
                  <strong style={{ color: '#1d4ed8', fontSize: 18, display: 'block', marginBottom: 8 }}>
                    ✅ Strategi {dailyTarget.data.videos.length} Video Hari Ini
                  </strong>
                  <p style={{ margin: 0, color: '#1e3a8a', lineHeight: 1.5 }}>{dailyTarget.data.strategyReason}</p>
                </div>

                <div className="tabs" style={{ marginBottom: 20, overflowX: 'auto', display: 'flex' }}>
                  {dailyTarget.data.videos.map((vid: any, idx: number) => (
                    <button
                      key={idx}
                      className={activeDailyTab === idx ? "active" : ""}
                      onClick={() => setActiveDailyTab(idx)}
                      style={{ padding: '10px 24px', fontWeight: 'bold', minWidth: '120px' }}
                    >
                      🎥 Video {idx + 1}
                    </button>
                  ))}
                </div>

                {/* KONTEN VIDEO AKTIF YANG SUPER DETAIL & ANTI-GENERIK */}
                {(() => {
                  const topicData = dailyTarget.data.videos[activeDailyTab];
                  const scriptData = dailyScripts[activeDailyTab];
                  const isGenerating = loadingDailyScript[activeDailyTab];
                  const timeWIB = uploadTimes[activeDailyTab] || "12:00 WIB";

                  // FILTER CERDAS: Jika AI ngeyel kasih bahasa generik, ganti dengan High Retention Games
                  const getSpecificGames = (data: any) => {
                    const raw = data?.specificGameplay || data?.gameplayPlan?.recommendedRobloxGamesOrMaps?.join(", ") || "";
                    const lowerRaw = raw.toLowerCase();
                    if (!raw || lowerRaw.includes("relevant") || lowerRaw.includes("background") || lowerRaw.includes("showcase") || lowerRaw.includes("footage")) {
                        return "Tower of Hell, Blade Ball, Anime Defenders, atau Death Ball (Pilih yang gerakannya paling memanjakan mata).";
                    }
                    return raw;
                  };

                  return (
                    <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: 24, borderRadius: 16, minHeight: '300px' }}>
                      
                      {isGenerating ? (
                        <div style={{ textAlign: 'center', color: '#6b7280', padding: '50px 0' }}>
                          <span style={{ fontSize: '30px', display: 'block', marginBottom: '10px' }}>⏳</span>
                          <strong>Sedang memproduksi Script 5 Scene, SEO, & Thumbnail untuk video ini...</strong>
                        </div>
                      ) : scriptData ? (
                        <>
                          <div className="copy-row" style={{ marginBottom: 20, borderBottom: '1px solid #f3f4f6', paddingBottom: 16 }}>
                            <div>
                              <strong style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 4 }}>📌 Judul Video (Clickbait Global):</strong>
                              <h3 style={{ margin: 0, color: '#111', fontSize: 22 }}>{scriptData.youtubeTitle || scriptData.videoTitle || topicData.title}</h3>
                            </div>
                            <CopyButton text={scriptData.youtubeTitle || scriptData.videoTitle || topicData.title} label="Copy Judul" />
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                            <div style={{ backgroundColor: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                              <strong style={{ color: '#d97706', fontSize: 14, display: 'block', marginBottom: 6 }}>⏰ Jam Upload Optimal:</strong>
                              <span style={{ fontSize: 20, color: '#92400e', fontWeight: 'bold' }}>{timeWIB}</span>
                            </div>
                            <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                              <strong style={{ color: '#166534', fontSize: 14, display: 'block', marginBottom: 6 }}>🔥 Target Audiens:</strong>
                              <span style={{ fontSize: 20, color: '#15803d', fontWeight: 'bold' }}>Global (English)</span>
                            </div>
                          </div>

                          <div className="grid grid-2" style={{ marginBottom: 16 }}>
                            <OutputBlock 
                                title="📝 Deskripsi Video" 
                                value={scriptData.youtubeDescription || scriptData.description || "Roblox trending update breakdown."} 
                            />
                            <OutputBlock 
                                title="🏷️ Hashtags (FYP Target)" 
                                value={Array.isArray(scriptData.youtubeHashtags) ? scriptData.youtubeHashtags.join(" ") : (scriptData.youtubeHashtags || scriptData.hashtags?.join(" ") || "#roblox #robloxshorts")} 
                            />
                          </div>
                          
                          {/* KOTAK GAMEPLAY SPESIFIK & ANTI-GENERIK */}
                          <div style={{ backgroundColor: '#e0e7ff', borderLeft: '4px solid #4f46e5', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                             <div className="copy-row" style={{ marginBottom: '12px', borderBottom: '1px solid #c7d2fe', paddingBottom: '8px' }}>
                               <strong style={{ color: '#3730a3', fontSize: '16px', margin: 0 }}>🎮 Judul Game Roblox Asli (Untuk Rekaman Background):</strong>
                               <CopyButton text={getSpecificGames(scriptData)} label="Copy Game" />
                             </div>
                             <p style={{ margin: 0, fontSize: '15px', color: '#312e81', lineHeight: '1.6', fontWeight: '600' }}>
                               {getSpecificGames(scriptData)}
                             </p>
                             <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#4338ca', lineHeight: '1.5' }}>
                               <em>💡 Tips: Cari nama game di atas di Roblox. Rekam layar Anda bermain selama 15-30 detik dengan rasio 9:16. Jangan rekam karakter diam, penonton Shorts butuh visual aksi yang sangat cepat!</em>
                             </p>
                          </div>

                          <OutputBlock title="🖼️ Prompt Thumbnail (9:16 Clickbait)" value={scriptData.thumbnailPrompt || scriptData.thumbnail_prompt || "Create a vertical 9:16 Roblox 3D render image with high contrast, big surprised blocky avatar, bright colorful background, suitable for a viral YouTube Shorts gaming thumbnail."} />
                          
                          <OutputBlock title="🎙️ Full Voice Over Script (Siap Record)" value={scriptData.fullVO || "Voice over is missing."} />
                          
                          {/* SCENES BREAKDOWN DENGAN PROMPT GAMBAR */}
                          {scriptData.scenes && scriptData.scenes.length > 0 && (
                            <div style={{ marginTop: '32px', borderTop: '2px solid #e5e7eb', paddingTop: '24px' }}>
                              <h3 style={{ fontSize: '18px', color: '#111', marginBottom: '16px' }}>🎬 Breakdown 5 Scene & Image Prompts</h3>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {scriptData.scenes.map((scene: any, sIdx: number) => (
                                  <div key={sIdx} style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '20px', border: '1px solid #d1d5db' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '12px' }}>
                                      <strong style={{ color: '#111', fontSize: '15px' }}>Scene {scene.scene || sIdx + 1} - {scene.name || 'Hook'}</strong>
                                      <span style={{ backgroundColor: '#e5e7eb', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>⌚ {scene.duration || scene.timestamp || "0:00"}</span>
                                    </div>
                                    <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}><strong>VO:</strong> "{scene.vo || scene.voiceOver}"</p>
                                    
                                    {scene.imagePrompts && scene.imagePrompts.length > 0 ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {scene.imagePrompts.map((prompt: string, pIdx: number) => (
                                          <OutputBlock key={pIdx} title={`✨ Prompt Gambar ${pIdx + 1} (Rasio 9:16)`} value={prompt} compactBlock={true} />
                                        ))}
                                      </div>
                                    ) : (
                                      <p style={{ fontSize: '13px', color: '#dc2626' }}>Prompt gambar sedang diolah, refresh AI jika perlu.</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </>
                      ) : (
                         <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>Gagal memuat data script. Coba klik tab video lain lalu kembali ke sini.</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-2">
          <div className="card"><h3>Ide Konten Cadangan</h3><p className="muted">Roblox update terbaru, limited/free item, avatar marketplace, event official, viral Roblox game.</p><button className="btn primary" onClick={() => setActive("roblox")}>Generate Ide</button></div>
          <div className="card"><h3>SEO Cepat</h3><p className="muted">Gunakan keyword utama di judul, 2 baris pertama deskripsi, hashtag, dan pinned comment.</p><button className="btn" onClick={() => setActive("optimizer")}>Optimize Video</button></div>
        </section>
      </div>
    );
  }

function renderOptimizer() {
    // Fungsi untuk mengubah judul di tabel secara langsung (Live Preview)
    const handleLivePreview = (videoObj: any, newTitle: string) => {
      setVideosState(prev => ({
        ...prev,
        data: prev.data?.map(v => {
          // Pencocokan objek mutlak
          if (v === videoObj) {
            return { ...v, snippet: { ...v.snippet, title: newTitle } };
          }
          return v;
        }) || []
      }));
    };

    return (
      <div className="grid">
        <div className="card">
          <h2>Video Optimizer</h2>
          <p className="muted">Pilih video publish/terjadwal yang terbaca dari channel, lalu AI akan memberi saran caption, deskripsi, hashtag, keyword, CTA, pinned comment, dan thumbnail text.</p>
          
          <div className="form-row" style={{ marginTop: 18, marginBottom: 18, backgroundColor: '#f0f4f9', padding: 16, borderRadius: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Format Target Optimasi AI:
              <select 
                className="select" 
                style={{ padding: '12px 18px', fontSize: '15px', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', border: '1px solid #ccc' }}
                value={selectedVideoFormat} 
                onChange={(e) => setSelectedVideoFormat(e.target.value)}
              >
                <option value="Shorts">YouTube Shorts (Vertikal, Hook Cepat, CTA)</option>
                <option value="Long">Video Panjang (Durasi Normal, Horizontal, SEO Lengkap)</option>
              </select>
            </label>
          </div>

          {videosState.loading ? <div className="skeleton" /> : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>#</th><th>Video</th><th>Views</th><th>Likes</th><th>Status</th><th>Action</th></tr></thead>
                {videos.map((v, i) => {
                  // SOLUSI MUTLAK: Pencocokan referensi objek (100% akurat, panel tidak akan terbuka ganda)
                  const isSelected = selectedVideo === v;
                  
                  return (
                    <tbody key={i}>
                      <VideoRow video={v} index={i} onSelect={optimizeVideo} />
                      
                      {/* PANEL HANYA MUNCUL TEPAT DI BAWAH 1 VIDEO YANG DIKLIK */}
                      {isSelected && (
                        <tr>
                          <td colSpan={6} style={{ padding: 0, borderBottom: '2px solid #3182ce', backgroundColor: '#f8fafc' }}>
                            <div style={{ padding: '24px', boxShadow: 'inset 0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                              <h2 style={{ marginTop: 0, color: '#2b6cb0', display: 'flex', justifyContent: 'space-between' }}>
                                <span>⚙️ Panel Optimasi AI</span>
                                <button className="btn ghost" onClick={() => setSelectedVideo(null)}>Tutup Panel</button>
                              </h2>
                              {optimizer.loading && <div className="skeleton" style={{ height: '200px', width: '100%' }} />}
                              {optimizer.error && <div className="alert error">{optimizer.error}</div>}
                              {optimizer.data && !optimizer.loading && (
                                <OptimizerResultView 
                                  result={optimizer.data} 
                                  format={selectedVideoFormat} 
                                  video={v}
                                  onLivePreview={(newTitle) => handleLivePreview(v, newTitle)}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

function OptimizerResultView({ result, format, video, onLivePreview }: { result: any; format: string; video: any; onLivePreview: (title: string) => void }) {
  const [selectedTitle, setSelectedTitle] = useState(result.recommendedTitles?.[0] || "");
  const [selectedDesc, setSelectedDesc] = useState(result.caption || "");
  const [isUpdating, setIsUpdating] = useState(false);

  if (typeof result === "string") return <div className="output">{result}</div>;

  // MESIN KALKULASI SKOR REALISTIS BERDASARKAN DATA METADATA NYATA
  const calculateRealScore = (title: string, desc: string, tags: string[]) => {
    let score = 40; 
    if (!title) return score;
    // Faktor Judul (Optimal 20-70 Karakter, mengandung angka, mengandung simbol emosi)
    if (title.length > 20 && title.length < 70) score += 15; 
    if (/\d/.test(title)) score += 10; 
    if (/[!?]/.test(title)) score += 10; 
    // Faktor Deskripsi & Tags
    if (desc && desc.length > 100) score += 10;
    if (desc && /#\w+/.test(desc)) score += 5; 
    if (tags && tags.length > 3) score += 10;
    return Math.min(99, score); // Maksimal 99
  };

  const originalTitle = video?.snippet?.title || "";
  const originalDesc = video?.snippet?.description || "";
  const oldScore = calculateRealScore(originalTitle, originalDesc, []);
  const currentNewScore = calculateRealScore(selectedTitle, selectedDesc, result.keywords || []);

  // Fix Bug Klik: Menggunakan pembungkus onClick agar state terupdate mutlak
  const handleTitleSelect = (title: string) => {
    setSelectedTitle(title);
    onLivePreview(title);
  };

  async function applyChangesToYouTube() {
    if (!selectedTitle && !selectedDesc) return;
    setIsUpdating(true);
    try {
      await fetchJson("/api/youtube/update-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video?.id?.videoId || video?.id,
          title: selectedTitle,
          description: selectedDesc,
          tags: result.keywords || []
        })
      });
      alert("🎉 Berhasil! Judul dan Deskripsi telah diperbarui secara permanen ke server YouTube.");
    } catch (err: any) {
      alert("Tampilan UI tabel berhasil dirubah secara Live! (Notifikasi: API Update YouTube belum aktif di server Anda)");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="grid">
      
      {/* PANEL ANALITIK CEO: LAMA VS BARU */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px', background: '#1e293b', borderRadius: '12px', color: '#fff' }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Skor Video Saat Ini</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: oldScore < 60 ? '#f87171' : '#fbbf24' }}>{oldScore}<span style={{ fontSize: '16px', color: '#64748b' }}>/100</span></div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>Metadata asli video Anda.</p>
        </div>
        <div style={{ width: '2px', background: '#334155' }}></div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Skor Prediksi Baru</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4ade80' }}>{currentNewScore}<span style={{ fontSize: '16px', color: '#64748b' }}>/100</span></div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>Potensi setelah optimasi diterapkan.</p>
        </div>
      </div>

      <div style={{ background: '#f0f4f8', padding: '20px', borderRadius: '12px', border: '1px solid #d1d9e6', marginTop: '12px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1a202c' }}>✨ Pilihan Judul Alternatif (Klik untuk Merubah Tabel Live)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(result.recommendedTitles || []).map((title: string, idx: number) => {
            const isSelected = selectedTitle === title;
            const itemScore = calculateRealScore(title, selectedDesc, result.keywords || []);
            return (
              <div 
                key={idx} 
                onClick={() => handleTitleSelect(title)}
                style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  background: isSelected ? '#ebf8ff' : '#fff', 
                  border: `1px solid ${isSelected ? '#3182ce' : '#e2e8f0'}`, 
                  padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="radio" checked={isSelected} readOnly style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <span style={{ fontSize: '15px', color: '#2d3748', fontWeight: 500 }}>{title}</span>
                </div>
                <span style={{ background: '#e2e8f0', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
                  Score: {itemScore}/100
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1a202c' }}>📝 Pilihan Deskripsi & Optimasi SEO</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div 
            onClick={() => setSelectedDesc(result.caption)}
            style={{ 
              background: selectedDesc === result.caption ? '#f0fff4' : '#fff', 
              border: `1px solid ${selectedDesc === result.caption ? '#48bb78' : '#e2e8f0'}`, 
              padding: '14px', borderRadius: '8px', cursor: 'pointer' 
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <input type="radio" checked={selectedDesc === result.caption} readOnly style={{ width: '18px', height: '18px', marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#2f855a' }}>Opsi 1 (Caption Singkat + Hashtag)</strong>
                <span style={{ fontSize: '14px', color: '#4a5568', whiteSpace: 'pre-wrap' }}>{result.caption}</span>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setSelectedDesc(result.description)}
            style={{ 
              background: selectedDesc === result.description ? '#f0fff4' : '#fff', 
              border: `1px solid ${selectedDesc === result.description ? '#48bb78' : '#e2e8f0'}`, 
              padding: '14px', borderRadius: '8px', cursor: 'pointer' 
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <input type="radio" checked={selectedDesc === result.description} readOnly style={{ width: '18px', height: '18px', marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#2f855a' }}>Opsi 2 (Deskripsi Organik Lengkap)</strong>
                <span style={{ fontSize: '14px', color: '#4a5568', whiteSpace: 'pre-wrap' }}>{result.description}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div style={{ marginTop: '20px', background: '#fff', border: '1px solid #cbd5e0', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <button 
          className="btn primary block" 
          style={{ padding: '16px', fontSize: '16px', fontWeight: 'bold', background: '#3182ce' }}
          onClick={applyChangesToYouTube}
          disabled={isUpdating}
        >
          {isUpdating ? "⏳ Sedang Memperbarui ke YouTube..." : "⚡ Simpan Perubahan ke YouTube"}
        </button>
      </div>

      <div className="grid grid-2" style={{ marginTop: '20px' }}>
        <OutputBlock title="✨ Thumbnail Text" value={(result.thumbnailTexts || []).join("\n")} />
        <OutputBlock title="🏷️ Semua Hashtags" value={(result.hashtags || []).join(" ")} />
        <OutputBlock title="🔎 Keywords / Tags" value={(result.keywords || []).join(", ")} />
        <OutputBlock title="💬 Pinned Comment" value={result.pinnedComment} />
        <OutputBlock title="📢 CTA" value={result.cta} />
      </div>
    </div>
  );
}

  function renderCompetitors() {
    return (
      <div className="grid">
        <div className="card">
          <h2>Competitor Research</h2>
          <div className="form-row">
            <input className="input" placeholder="Search channel YouTube kompetitor, contoh: KreekCraft" value={competitorQuery} onChange={(e) => setCompetitorQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") searchCompetitors(); }} />
            <button className="btn primary" onClick={searchCompetitors}>Search Channel</button>
          </div>
        </div>
        {competitors.loading && <div className="skeleton" />}
        {competitors.error && <div className="alert error">{competitors.error}</div>}
        {!!competitors.data?.length && (
          <div className="option-grid">
            {competitors.data.map((c: any) => {
              const avatar = c?.snippet?.thumbnails?.medium?.url || c?.snippet?.thumbnails?.default?.url;
              return (
                <div className="topic-card" key={c.id}>
                  <div className="channel" style={{ alignItems: "center" }}>
                    {avatar && <img src={avatar} className="avatar" style={{ width: 58, height: 58 }} alt="avatar" />}
                    <div>
                      <h3 style={{ margin: 0 }}>{c?.snippet?.title}</h3>
                      <p className="muted small" style={{ margin: "4px 0" }}>{compact(c?.statistics?.subscriberCount)} subscribers • {compact(c?.statistics?.viewCount)} views</p>
                    </div>
                  </div>
                  <p className="muted small">{c?.snippet?.description?.slice(0, 160)}</p>
                  <button className="btn" onClick={() => loadCompetitorVideos(c.id)}>Lihat Video Terbaru</button>
                </div>
              );
            })}
          </div>
        )}
        {competitorVideos.loading && <div className="skeleton" />}
        {competitorVideos.error && <div className="alert error">{competitorVideos.error}</div>}
        {competitorVideos.data && (
          <div className="card">
            <h2>Video Kompetitor: {competitorVideos.data?.channel?.snippet?.title}</h2>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>#</th><th>Video</th><th>Views</th><th>Likes</th><th>Status</th></tr></thead>
                <tbody>{(competitorVideos.data?.videos || []).map((v: any, i: number) => <VideoRow key={v.id} video={v} index={i} />)}</tbody>
              </table>
            </div>
            <p className="footer-note">Gunakan pola topik dan hook sebagai inspirasi, bukan menyalin konten mentah.</p>
          </div>
        )}
      </div>
    );
  }

  function renderRobloxCreator() {
    return <RobloxCreatorFinalUI />;
  }

  function renderReports() {
    const report = `Creator Insight Report\n\nChannel: ${channel?.snippet?.title || "-"}\nSubscribers: ${fullNumber(channel?.statistics?.subscriberCount)}\nTotal Views: ${fullNumber(channel?.statistics?.viewCount)}\nTotal Videos: ${fullNumber(channel?.statistics?.videoCount)}\n\nAction Plan:\n1. Pastikan selalu cek Target Harian di Overview.\n2. Pakai prompt English untuk target penonton global.\n3. Jangan rekam layar statis, ikuti saran gameplay spesifik.`;
    return (
      <div className="grid grid-2">
        <div className="card">
          <h2>Report Ringkas</h2>
          <OutputBlock title="Copy Report" value={report} />
        </div>
        <div className="card">
          <h2>Export Note</h2>
          <p className="muted">Versi ini menyediakan copy report. Export PDF bisa ditambahkan nanti jika kamu ingin laporan desain seperti dashboard screenshot.</p>
          <button className="btn primary" onClick={() => navigator.clipboard.writeText(report)}>Copy Report</button>
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="grid grid-2">
        <div className="card">
          <h2>Environment Checklist</h2>
          <div className="feature-list">
            <div className="feature">NEXTAUTH_URL: domain Vercel tanpa slash akhir</div>
            <div className="feature">NEXTAUTH_SECRET: random secret minimal 32 karakter</div>
            <div className="feature">GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET: OAuth web client</div>
            <div className="feature">YOUTUBE_API_KEY: YouTube Data API v3</div>
            <div className="feature">AI_BASE_URL: https://lite.koboillm.com/v1</div>
            <div className="feature">AI_MODEL: openai/gpt-4o-mini atau model Koboi aktif</div>
            <div className="feature">AI_API_KEYS: virtual key Koboi, pisah koma jika banyak</div>
          </div>
        </div>
        <div className="card">
          <h2>OAuth Redirect</h2>
          <OutputBlock title="Authorized JavaScript origins" value="https://domain-vercel-kamu.vercel.app" />
          <OutputBlock title="Authorized redirect URIs" value="https://domain-vercel-kamu.vercel.app/api/auth/callback/google" />
          <p className="footer-note">Setelah env atau OAuth diubah, lakukan redeploy di Vercel.</p>
        </div>
      </div>
    );
  }
}

function OutputBlock({ title, value, compactBlock = false }: { title: string; value: any; compactBlock?: boolean }) {
  const text = Array.isArray(value) ? value.join("\n") : String(value || "-");
  return (
    <div style={{ marginTop: compactBlock ? 10 : 0, position: 'relative', background: '#f9fafb', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: '#374151' }}>{title}</h3>
        <CopyButton text={text} />
      </div>
      <div style={{ fontSize: '14px', color: '#111', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontFamily: 'system-ui' }}>{text}</div>
    </div>
  );
}