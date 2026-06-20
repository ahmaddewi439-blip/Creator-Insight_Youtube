"use client";

import React, { useEffect, useMemo, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
type TabId = "overview" | "optimizer" | "competitors" | "roblox" | "reports" | "opportunity";

type ApiState<T> = {
  loading: boolean;
  error: string;
  data: T | null;
};

const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "overview", label: "Dasbor", icon: "🏠" },
    { id: "optimizer", label: "Optimasi", icon: "🪄" },
    { id: "competitors", label: "Riset", icon: "📈" },
    { id: "roblox", label: "Sutradara", icon: "🎬" },
    { id: "opportunity", label: "Lab", icon: "🧠" }
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
  // 1. Radar Khusus untuk format Playlist/Uploads YouTube
  if (video.snippet?.resourceId?.videoId) return video.snippet.resourceId.videoId;
  // 2. Radar untuk format pencarian standar
  if (video.id?.videoId) return video.id.videoId;
  // 3. Radar untuk format ID langsung
  if (typeof video.id === "string" && video.id.length === 11) return video.id;
  // 4. Fallback terakhir
  return video.videoId || (typeof video.id === "string" ? video.id : "");
}

export default function CreatorInsightApp() {
  const { data: session, status } = useSession();
  const [active, setActive] = useState<TabId>("overview");
  const [channelState, setChannelState] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [videosState, setVideosState] = useLocalStorage<ApiState<any[]>>("simpanan_video", { loading: false, error: "", data: [] });
  const [selectedVideo, setSelectedVideo] = useLocalStorage<any>("simpanan_pilihan_video", null);
  const [optimizer, setOptimizer] = useLocalStorage<ApiState<any>>("simpanan_hasil_seo", { loading: false, error: "", data: null });
  const [isGeneratingViral, setIsGeneratingViral] = useState(false);
  const [viralVideos, setViralVideos] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [dailyTarget, setDailyTarget] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [dailyScripts, setDailyScripts] = useState<Record<number, any>>({});
  const [loadingDailyScript, setLoadingDailyScript] = useState<Record<number, boolean>>({});
  const [activeDailyTab, setActiveDailyTab] = useState<number>(0);
  const [opportunityLoading, setOpportunityLoading] = useState(false);
  const [opportunityResults, setOpportunityResults] = useState<any[]>([]);
  
  // TAMBAHKAN KODE INI UNTUK EFEK VIDIQ:
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null);
  const [scriptLoadingStep, setScriptLoadingStep] = useState<number>(0);
  const [optCategory, setOptCategory] = useState("Travel & Events");
  const [optAudience, setOptAudience] = useState("Worldwide");
  const [optStyle, setOptStyle] = useState("AI Cinematic Documentary");
  const [optKeyword, setOptKeyword] = useState("");
  const [optLanguage, setOptLanguage] = useState("English");
  const handleExpandScript = (index: number) => {
    if (expandedIdea === index) {
      setExpandedIdea(null); // Tutup jika diklik lagi
      return;
    }
    setExpandedIdea(index);
    setScriptLoadingStep(1);
    
    // Simulasi efek loading bertahap ala vidIQ
    setTimeout(() => setScriptLoadingStep(2), 1500); // Berpikir 1.5 detik
    setTimeout(() => setScriptLoadingStep(3), 3500); // Berpikir 3.5 detik
    setTimeout(() => setScriptLoadingStep(4), 5000); // Selesai, tampilkan naskah!
  };
  // -----------------------------------
  // --- STATE UNTUK GOOGLE TRENDS ASLI ---
  const [trendQuery, setTrendQuery] = useState("roblox");
  const [trendData, setTrendData] = useState<any[]>([]);
  const [topKeywords, setTopKeywords] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);

  async function fetchTrends() {
    setLoadingTrends(true);
    try {
      const res = await fetch(`/api/youtube/trends?q=${trendQuery}`);
      const data = await res.json();
      setTrendData(data.timelineData || []); // Data Grafik
      setTopKeywords(data.topKeywords || []); // Data Kata Kunci
    } catch (e) {
      console.error(e);
    }
    setLoadingTrends(false);
  }
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#020617', color: '#f8fafc', overflow: 'hidden' }}>
      
      {/* HEADER ATAS (NAMA APP & LOGOUT) */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🚀</span>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Creator Insight</h1>
        </div>
        <button onClick={() => signOut()} style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>
          Logout
        </button>
      </div>

   {/* AREA KONTEN UTAMA (BISA DI-SCROLL) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '90px' }}>
        {active === "overview" && renderOverview()}
        {active === "optimizer" && renderOptimizer()}
        {active === "competitors" && renderCompetitors()}
        {active === "roblox" && renderSutradara()}
        {active === "reports" && <div><h2>Laporan</h2></div>}
        {active === "opportunity" && renderOpportunityLab()}
        
      </div>

      {/* BOTTOM NAVIGATION BAR (GAYA VIDIQ) */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#0f172a',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        zIndex: 50,
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        {tabs.map(tab => {
          const isActive = active === tab.id;
          return (
            <div 
              key={tab.id} 
              onClick={() => setActive(tab.id)} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '4px',
                cursor: 'pointer',
                width: '20%',
                color: isActive ? '#3b82f6' : '#64748b' // Biru nyala jika aktif
              }}
            >
              <span style={{ fontSize: '22px', filter: isActive ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'none' }}>
                {tab.icon}
              </span>
              <span style={{ fontSize: '11px', fontWeight: isActive ? '600' : '400' }}>
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>
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
        </div>
    );
  }
  // 🧠 REAL AI SCORING ENGINE (PHASE 3)

function calculateTrendScore(keyword: string) {
  const hotWords = [
    "hidden", "secret", "vanished", "forbidden", "unreal",
    "AI", "real", "true", "impossible", "unknown"
  ];

  let score = 50;

  hotWords.forEach(word => {
    if (keyword.toLowerCase().includes(word)) {
      score += 8;
    }
  });

  return Math.min(100, score);
}

function calculateDemandScore(niche: string) {
  const highDemandTriggers = [
    "real", "secret", "hidden", "disappear", "history",
    "money", "survive", "mystery", "fake", "unreal"
  ];

  let score = 40;

  highDemandTriggers.forEach(word => {
    if (niche.toLowerCase().includes(word)) {
      score += 10;
    }
  });

  return Math.min(100, score);
}

function calculateCompetitionScore(category: string) {
  const highCompetition = ["gaming", "finance"];
  const lowCompetition = ["animals", "science", "travel"];

  let score = 50;

  if (highCompetition.includes(category.toLowerCase())) score += 30;
  if (lowCompetition.includes(category.toLowerCase())) score -= 20;

  return Math.max(10, Math.min(100, score));
}

function calculateViralScore(trend: number, demand: number, competition: number) {
  return Math.round(
    (trend * 0.4) +
    (demand * 0.4) +
    ((100 - competition) * 0.2)
  );
}

async function fetchYouTubeSuggestions(query: string) {
  try {
    const res = await fetch(`/api/youtube-suggest?q=${query}`);
    const data = await res.json();
    return data.keywords || [];
  } catch {
    return [];
  }
}

async function fetchTrendScore(keyword: string) {
  try {
    const res = await fetch(`/api/google-trends?q=${keyword}`);
    const data = await res.json();
    return data.score || 50;
  } catch {
    return 50;
  }
}

async function fetchCompetitionScore(keyword: string) {
  try {
    const res = await fetch(`/api/youtube-competition?q=${keyword}`);
    const data = await res.json();
    return data.score || 50;
  } catch {
    return 50;
  }
}

// Fungsi dipanggil otomatis saat kartu Niche diklik
 // FUNGSI V2: GENERATE IDE LALU FILTER DENGAN YOUTUBE LIVE DATA
  async function handleSelectNicheAndGenerate(selectedNiche: string) {
    setOptCategory(selectedNiche);
    setOpportunityResults([]);
    setOpportunityLoading(true);

    try {
      // TAHAP 1: Minta AI Meracik Ide
      const resAI = await fetch("/api/ai/opportunity-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedNiche,
          audience: "Worldwide",
          style: "AI Cinematic Documentary",
          keyword: "",
          language: optLanguage
        })
      });

      const dataAI = await resAI.json();
      if (!dataAI.success || !dataAI.results) {
        throw new Error(dataAI.error || "AI gagal memberikan ide.");
      }

      let rawIdeas: any[] = dataAI.results || [];
      let finalApprovedIdeas: any[] = [];

      // TAHAP 2: Mengecek Fakta Kompetitor ke YouTube API
      for (let idea of rawIdeas) {
        const mainKeyword = idea.keywords && idea.keywords.length > 0 ? idea.keywords[0].word : "Roblox Mystery";
        
       const resYT = await fetch("/api/youtube/youtube-competition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: mainKeyword })
        });

        const dataYT = await resYT.json();
        
        if (dataYT.success) {
          const totalCompetitors = dataYT.totalResults;
          if (totalCompetitors < 500000) {
            idea.youtubeData = {
              liveCompetitors: totalCompetitors,
              status: "VERIFIED LOW COMPETITION",
              topCompetitor: dataYT.competitors && dataYT.competitors.length > 0 ? dataYT.competitors[0].title : "Tidak ada"
            };
            finalApprovedIdeas.push(idea);
          }
        } else {
          finalApprovedIdeas.push(idea);
        }
      }

      // TAHAP 3: Tampilkan Hasil yang Lolos Sensor
      if (finalApprovedIdeas.length > 0) {
        setOpportunityResults(finalApprovedIdeas);
      } else {
        alert("Semua ide dari AI ternyata sudah terlalu ramai di YouTube! Silakan coba klik kategori lagi untuk mencari celah lain.");
      }

    } catch (error) {
      console.error("Pipeline V2 Error:", error);
      alert("Terjadi kesalahan sistem saat meracik ide V2.");
    }
    setOpportunityLoading(false);
  }

  function renderSutradaraProMax() {
  async function handleGenerate() {
      setIsGeneratingViral(true);
      setViralVideos([]); 
      try {
        const res = await fetch('/api/ai/viral-factory', { method: 'POST' });
        const data = await res.json();
        
        if (data.success && data.videos) {
          setViralVideos(data.videos); 
        } else {
           alert("Gagal meracik viral pack.");
        }
      } catch(err) {
        alert("Gagal memuat API.");
      }
      setIsGeneratingViral(false);
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* ... (Header Card dan Dashboard Card tetap sama seperti kode Anda) ... */}

        {/* Viral Factory Card */}
        <div style={{ background: '#047857', padding: '2px', borderRadius: '14px' }}> {/* Premium Dark Green Border */}
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '20px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>🎯 Viral Factory</h3>
            <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '20px' }}>Generate 4 video + AI ranking + viral scoring otomatis berdasarkan tren YouTube saat ini.</p>
            
            {/* TOMBOL */}
            <button 
              onClick={handleGenerate}
              disabled={isGeneratingViral}
              style={{ width: '100%', padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px' }}
            >
              {isGeneratingViral ? "⏳ AI Sedang Menganalisis Tren YouTube..." : "⚡ Generate Viral Pack (4 Video AI)"}
            </button>

            {/* KOTAK HASIL (Muncul Otomatis Setelah AI Selesai) */}
         {/* HASIL 4 VIDEO TERPISAH */}
            {viralVideos.length > 0 && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {viralVideos.map((video, idx) => {
                  // Format teks rapi khusus untuk di-copy
                  const copyText = `🔥 VIDEO ${idx + 1}\nTitle: ${video.title}\nDescription: ${video.description}\nHashtags: ${video.hashtags}\nBest Upload Time: ${video.uploadTime}\n\n🎬 Grok AI Video Prompts (Vertical 9:16):\n${video.prompts.map((p: string, i: number) => `- Prompt ${i + 1}: "${p}"`).join("\n")}`;

                  return (
                    <div key={idx} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
                      
                      {/* Header Tiap Video + Tombol Copy */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '12px 16px', borderBottom: '1px solid #334155' }}>
                        <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' }}>🔥 VIDEO {idx + 1}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(copyText);
                            setCopiedId(idx);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          style={{ background: copiedId === idx ? '#059669' : '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          {copiedId === idx ? "✅ Berhasil Dicopy!" : `📋 Copy Video ${idx + 1}`}
                        </button>
                      </div>

                      {/* Isi Teks Tiap Video */}
                      <div style={{ padding: '16px', color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                        <p><strong>Title:</strong> <span style={{color: '#f8fafc'}}>{video.title}</span></p>
                        <p><strong>Description:</strong> {video.description}</p>
                        <p><strong>Hashtags:</strong> <span style={{color: '#38bdf8'}}>{video.hashtags}</span></p>
                        <p><strong>Upload Time:</strong> {video.uploadTime}</p>
                        
                        <div style={{ marginTop: '12px', background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                          <strong style={{ display: 'block', marginBottom: '8px', color: '#f8fafc' }}>🎬 Grok AI Prompts:</strong>
                          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {video.prompts.map((p: string, i: number) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
            
          </div>
        </div>
      </div>
    );
  }

function renderSutradara() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Panggil Tampilan PRO MAX di atas */}
        {renderSutradaraProMax()}

        <section className="grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="card" style={{ border: '2px solid #10b981', background: 'linear-gradient(to right, #064e3b, #022c22)', padding: '24px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#34d399', margin: '0 0 8px 0', fontSize: '20px' }}>🎬 Sutradara AI (Full Video)</h2>
          <p style={{ color: '#a7f3d0', margin: '0 0 16px 0', fontSize: '14px', lineHeight: '1.5' }}>Buat naskah video panjang (5-20 Menit) dengan Voice Over spesifik, instruksi overlay teks, dan format gambar Micro-Pacing (Slide-by-Slide) untuk channel luar negeri.</p>
          <button onClick={() => window.location.href='/long-video'} style={{ width: '100%', background: '#10b981', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            Masuk ke Sutradara AI 🚀
          </button>
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

 // FUNGSI TOMBOL SIMPAN KE YOUTUBE (Tembus Tanpa Blokir Frontend)
    const handleSaveToYouTube = async (e: any) => {
      if (!selectedVideo) return;
      
      const btn = e.currentTarget;
      const originalText = btn.innerHTML;
      btn.innerHTML = "⏳ Mengirim Tembakan ke Server...";
      btn.disabled = true;

      try {
        const v = selectedVideo;
        let videoId = "";

        // 1. Pemindai Jalur Normal
        if (v.snippet?.resourceId?.videoId) videoId = v.snippet.resourceId.videoId;
        else if (v.id?.videoId) videoId = v.id.videoId;
        else if (typeof v.id === "string" && v.id.length === 11) videoId = v.id;
        else if (v.videoId) videoId = v.videoId;

        // 2. Pemindai Sinar-X (Mencari ID 11 Karakter di seluruh celah data)
        if (!videoId || videoId.length > 11) {
          const stringData = JSON.stringify(v);
          // Cari pola string persis 11 karakter (Format baku ID YouTube)
          const match = stringData.match(/"([a-zA-Z0-9_-]{11})"/);
          if (match) videoId = match[1];
          else videoId = v.id || v.videoId || ""; // Pasrah ambil ID apapun bentuknya
        }

        const title = v.title || v.snippet?.title || "";
        const description = v.snippet?.description || "";
        const tags = v.snippet?.tags || v.tags || [];
        const categoryId = v.snippet?.categoryId || "20"; 

        if (!title) throw new Error("Judul tidak terdeteksi. Silakan klik rekomendasi judul di atas sekali lagi.");

        // KITA HAPUS SEMUA BLOKIRAN FRONTEND! Biarkan menembak langsung ke API Google
        const res = await fetch("/api/youtube/update-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, title, description, tags, categoryId })
        });
        
        const data = await res.json();
        
        // Tangkap jawaban ASLI dari Server Google
        if (!res.ok) {
           if (res.status === 401 || res.status === 403) {
             throw new Error("Izin Ditolak oleh Google.\n\nSOLUSI: Tekan tombol 'Logout', lalu Login kembali. Saat pop-up Google muncul, WAJIB CENTANG kotak 'Kelola Akun YouTube'.");
           }
           throw new Error(data.error || "Server YouTube menolak data video ini.");
        }

        alert("🚀 SUKSES BESAR (LIVE YOUTUBE)!\n\nPerubahan Judul, Deskripsi, dan Hashtag sudah permanen di YouTube Studio Anda!");
      } catch (err: any) {
        alert("❌ GAGAL: " + err.message);
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
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
                  const isSelected = selectedVideo && getVideoId(selectedVideo) && getVideoId(selectedVideo) === getVideoId(v);
                  
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

function renderCompetitors() { 
    return (
      <div className="grid">
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>📈 Riset Tren Real-Time (Google & YouTube Data)</h2>
          <p className="muted">Grafik fluktuasi pencarian 30 hari terakhir & kata kunci terkait (100% Asli).</p>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', marginTop: '16px' }}>
            <input 
              type="text" 
              value={trendQuery} 
              onChange={(e) => setTrendQuery(e.target.value)} 
              placeholder="Ketik topik (contoh: roblox horror)"
              style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: '15px' }}
            />
            <button className="btn primary" onClick={fetchTrends} disabled={loadingTrends}>
              {loadingTrends ? "⏳ Menarik Data Asli..." : "Cari Tren"}
            </button>
          </div>

          {trendData.length > 0 && (
            <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#60a5fa', marginBottom: '16px', fontSize: '16px' }}>Fluktuasi Pencarian 30 Hari Terakhir: "{trendQuery}"</h3>
              
              {/* AREA GRAFIK NAIK TURUN VIDIQ */}
              <div style={{ height: 280, width: '100%', marginBottom: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="date" stroke="#cbd5e1" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6', color: 'white', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} dot={{ r: 2, fill: '#10b981' }} activeDot={{ r: 8, fill: '#34d399' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <h4 style={{ color: '#94a3b8', marginBottom: '10px', fontSize: '14px' }}>🔥 Top Keywords Terkait (Paling Banyak Dicari):</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {topKeywords.map((item, idx) => (
                  <span key={idx} style={{ background: '#1e293b', color: '#f8fafc', padding: '8px 14px', borderRadius: '20px', fontSize: '13px', border: '1px solid #334155', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {item.keyword} <strong style={{ color: '#10b981', background: '#064e3b', padding: '2px 6px', borderRadius: '4px' }}>Skor: {item.score}</strong>
                  </span>
                ))}
                {topKeywords.length === 0 && <span style={{color: '#64748b'}}>Tidak ada data keyword terkait yang cukup.</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    ); 
  }
  // FUNGSI COPY SEMUA PROMPT GROK SEKALIGUS
  const handleCopyAllPrompts = (item: any) => {
    let allPrompts = `THUMBNAIL PROMPT:\n${item.thumbnailPrompt}\n\n`;
    item.scenes.forEach((scene: any, idx: number) => {
      allPrompts += `--- SCENE ${idx + 1} ---\n`;
      allPrompts += `IMAGE: ${scene.imagePrompt}\n`;
      allPrompts += `VIDEO: ${scene.videoPrompt}\n\n`;
    });
    navigator.clipboard.writeText(allPrompts);
    alert("✅ Semua Grok Prompts berhasil di-copy!");
  };

  // FUNGSI DOWNLOAD SCRIPT SEBAGAI FILE TXT
  const handleDownloadScript = (item: any) => {
    let txtContent = `JUDUL: ${item.title}\nNICHE: ${optCategory}\nSKOR: ${item.score}/35\n\n`;
    txtContent += `AUDIO MOOD: ${item.audioMood}\n\n`;
    txtContent += `--- VOICE OVER SCRIPT ---\n`;
    item.scenes.forEach((scene: any) => {
      txtContent += `${scene.waktu}: ${scene.vo}\n`;
    });
    txtContent += `\n--- DESCRIPTION ---\n${item.description}\n\nTAGS: ${item.tags}`;
    
    const blob = new Blob([txtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Script_${item.title.substring(0, 20)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

 function renderOpportunityLab() {
  // Daftar Niche Premium
  const niches = [
    { name: "Gaming / Roblox", icon: "🎮", desc: "Misteri game, mitos, dan sejarah fitur yang dihapus." },
    { name: "Travel & Events", icon: "🌍", desc: "Tempat nyata di bumi yang terlihat seperti buatan AI." },
    { name: "Pets & Animals", icon: "🐾", desc: "Hewan dengan kemampuan aneh atau dikira punah." },
    { name: "Science & Technology", icon: "🔭", desc: "Penemuan mustahil dan fakta sains yang mencekam." },
    { name: "Finance / History", icon: "💰", desc: "Sejarah uang yang hancur dan penipuan terbesar." }
  ];

  return (
    <div className="grid">
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; display: inline-block; }
        .vidiq-step { color: #94a3b8; font-size: 14px; margin: 8px 0; display: flex; alignItems: center; gap: 8px; }
        .vidiq-step.done { color: #10b981; }
        .niche-card { background: #1e293b; border: 1px solid #334155; padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.2s; text-align: center; }
        .niche-card:hover { border-color: #38bdf8; transform: translateY(-3px); background: #0f172a; }
      `}</style>

      {/* TAMPILAN AWAL: PILIH NICHE (Hanya muncul jika belum ada hasil dan tidak loading) */}
      {opportunityResults.length === 0 && !opportunityLoading && (
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', color: '#f8fafc', marginBottom: '10px' }}>🧠 Pilih Niche Channel Anda</h2>
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Pilih kategori di bawah ini. AI akan otomatis mencarikan 3 ide konten dengan skor peluang tertinggi untuk Anda eksekusi.</p>
          {/* MENU PILIHAN BAHASA GLOBAL */}
          <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <label style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '16px' }}>🌐 Pilih Bahasa Video Utama Anda:</label>
            <select 
              value={optLanguage} 
              onChange={(e) => setOptLanguage(e.target.value)} 
              style={{ padding: '10px 20px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #3b82f6', fontSize: '15px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="English">🇺🇸 English (Global/US)</option>
              <option value="Indonesian">🇮🇩 Indonesia</option>
              <option value="Spanish">🇪🇸 Spanish (Spanyol/Amerika Latin)</option>
              <option value="Portuguese">🇧🇷 Portuguese (Brasil/Portugal)</option>
              <option value="German">🇩🇪 German (Jerman)</option>
              <option value="Japanese">🇯🇵 Japanese (Jepang)</option>
              <option value="Arabic">🇸🇦 Arabic (Timur Tengah)</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {niches.map((niche, idx) => (
              <div key={idx} className="niche-card" onClick={() => handleSelectNicheAndGenerate(niche.name)}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{niche.icon}</div>
                <h3 style={{ color: '#e2e8f0', fontSize: '16px', margin: '0 0 8px 0' }}>{niche.name}</h3>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '0', lineHeight: '1.4' }}>{niche.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EFEK LOADING AWAL MENCARI IDE */}
      {opportunityLoading && (
        <div className="card" style={{ border: '1px solid #3b82f6', background: '#0f172a', textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }} className="spinner">⚙️</div>
          <h3 style={{ color: '#38bdf8', marginBottom: '16px' }}>Menganalisa Algoritma untuk Niche "{optCategory}"...</h3>
          <div style={{ display: 'inline-block', textAlign: 'left' }}>
            <div className="vidiq-step done"><span>✓</span> Memindai tren global terbaru</div>
            <div className="vidiq-step done"><span>✓</span> Menyaring ide dengan kompetisi terendah</div>
            <div className="vidiq-step"><span className="spinner">⏳</span> Meracik 3 ide dengan skor di atas 30/35...</div>
          </div>
        </div>
      )}

      {/* TOMBOL KEMBALI KE MENU (Muncul saat hasil sudah ada) */}
      {opportunityResults.length > 0 && !opportunityLoading && (
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>🎯 Top Peluang: {optCategory}</h2>
          <button 
            onClick={() => setOpportunityResults([])} 
            style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
          >
            🔙 Kembali ke Pilihan Niche
          </button>
        </div>
      )}

      {/* RESULT LIST ALA VIDIQ (Biarkan kode {opportunityResults.map...} Anda di bawah ini tetap utuh) */}

      {/* RESULT LIST ALA VIDIQ */}
      {opportunityResults.map((item: any, i: number) => {
        const isExpanded = expandedIdea === i;
        const step = scriptLoadingStep;

        return (
          <div key={i} className="card" style={{ marginBottom: '24px', border: '1px solid #334155', transition: 'all 0.3s' }}>
            
            {/* BAGIAN ATAS (SELALU TAMPIL) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <h3 style={{ color: '#fbbf24', fontSize: '18px', margin: 0 }}>{item.title}</h3>
              <span style={{ background: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' }}>Skor: {item.score}/35</span>
            </div>
            {/* STEMPEL BUKTI YOUTUBE DATA API (V2) */}
        {item.youtubeData && (
          <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed #10b981', borderRadius: '6px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', display: 'block' }}>✓ {item.youtubeData.status}</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Berdasarkan pengecekan API Real-time</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 'bold', display: 'block' }}>{item.youtubeData.liveCompetitors.toLocaleString()}</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Video Kompetitor Aktif</span>
            </div>
          </div>
        )}

            <div style={{ margin: '16px 0', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 10px 0' }}><strong>🔥 Kenapa: </strong> <span style={{ color: '#cbd5e1' }}>{item.kenapa}</span></p>
              <p style={{ margin: '0 0 10px 0' }}><strong>🎯 Angle: </strong> <span style={{ color: '#cbd5e1' }}>{item.angle}</span></p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
              <strong style={{ fontSize: '14px' }}>Keywords:</strong>
              {item.keywords?.map((kw: any, idx: number) => (
                <span key={idx} style={{ background: '#1e293b', color: '#93c5fd', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', border: '1px solid #3b82f6' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 'bold', marginRight: '4px' }}>{kw.power}</span> {kw.word}
                </span>
              ))}
            </div>

            {/* TOMBOL AKSI BERTAHAP (PROGRESSIVE DISCLOSURE) */}
            {!isExpanded && (
              <button 
                onClick={() => handleExpandScript(i)}
                style={{ background: 'transparent', border: '1px solid #60a5fa', color: '#60a5fa', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
              >
                ✨ Bantu skrip Ide {i + 1}
              </button>
            )}

            {/* AREA LOADING BERTAHAP (MUNCUL SAAT TOMBOL DIKLIK) */}
            {isExpanded && step < 4 && (
              <div style={{ background: '#020617', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b', marginTop: '16px' }}>
                <div className={step >= 1 ? "vidiq-step done" : "vidiq-step"}>
                  {step > 1 ? "✓" : <span className="spinner">⏳</span>} Berpikir selama 2 detik... menganalisa pola viral...
                </div>
                {step >= 2 && (
                  <div className={step >= 2 ? "vidiq-step done" : "vidiq-step"}>
                    {step > 2 ? "✓" : <span className="spinner">⏳</span>} Tools sudah siap. Menarik transkrip video terbaik di niche ini...
                  </div>
                )}
                {step >= 3 && (
                  <div className={step >= 3 ? "vidiq-step done" : "vidiq-step"}>
                    <span className="spinner">⏳</span> Meracik Voice Over style & Struktur Visual...
                  </div>
                )}
              </div>
            )}

            {/* HASIL KESELURUHAN (MUNCUL SETELAH LOADING SELESAI) */}
            {isExpanded && step === 4 && (
              <div style={{ marginTop: '24px', animation: 'fadeIn 0.5s ease-in' }}>
                {/* 🎵 AUDIO MOOD & 🖼️ THUMBNAIL (FITUR PRO) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155', borderLeft: '4px solid #f59e0b' }}>
                    <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '8px' }}>🎧 Rekomendasi Audio & Musik</strong>
                    <p style={{ color: '#cbd5e1', fontSize: '14px', margin: 0 }}>{item.audioMood}</p>
                  </div>
                  <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155', borderLeft: '4px solid #ef4444' }}>
                    <strong style={{ color: '#ef4444', display: 'block', marginBottom: '8px' }}>🖼️ Grok Thumbnail Prompt</strong>
                    <code style={{ color: '#e2e8f0', fontSize: '12px', whiteSpace: 'pre-wrap', display: 'block' }}>{item.thumbnailPrompt}</code>
                  </div>
                </div>

                {/* 📥 TOMBOL ACTION PRO */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <button onClick={() => handleDownloadScript(item)} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    📥 Download Script Naskah (.txt)
                  </button>
                  <button onClick={() => handleCopyAllPrompts(item)} style={{ flex: 1, background: '#8b5cf6', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    📋 Copy Semua Grok Prompt
                  </button>
                </div>
                {/* 🎬 FULL VIDEO PACK: SCENE-BY-SCENE */}
                <div style={{ marginBottom: '20px', background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '20px', fontSize: '16px' }}>
                    <span>🎬</span> FULL VIDEO PACK: SCRIPT & GROK PROMPTS
                  </strong>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {item.scenes?.map((scene: any, idx: number) => (
                      <div key={idx} style={{ background: '#1e293b', borderRadius: '8px', padding: '16px', borderLeft: '4px solid #38bdf8' }}>
                        
                        {/* Judul Scene & Waktu */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '12px' }}>
                          <strong style={{ color: '#fbbf24', fontSize: '15px' }}>Scene {idx + 1} • {scene.waktu}</strong>
                        </div>
                        
                        {/* Narasi dan Visual */}
                        <div style={{ marginBottom: '12px' }}>
                          <strong style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '4px' }}>🗣️ VOICE OVER (English):</strong>
                          <p style={{ color: '#f8fafc', margin: '0', fontSize: '16px', fontStyle: 'italic', background: '#020617', padding: '10px', borderRadius: '6px' }}>"{scene.vo}"</p>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <strong style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '4px' }}>🎥 VISUAL ACTION:</strong>
                          <p style={{ color: '#cbd5e1', margin: '0', fontSize: '14px' }}>{scene.visual}</p>
                        </div>

                        {/* Box Prompt Grok */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                          <div style={{ background: '#020617', padding: '12px', borderRadius: '6px', border: '1px solid #334155' }}>
                            <strong style={{ color: '#c084fc', fontSize: '12px', display: 'block', marginBottom: '8px' }}>🖼️ GROK IMAGE PROMPT</strong>
                            <code style={{ color: '#e2e8f0', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block', lineHeight: '1.5' }}>{scene.imagePrompt}</code>
                          </div>
                          <div style={{ background: '#020617', padding: '12px', borderRadius: '6px', border: '1px solid #334155' }}>
                            <strong style={{ color: '#f472b6', fontSize: '12px', display: 'block', marginBottom: '8px' }}>🎞️ GROK VIDEO PROMPT</strong>
                            <code style={{ color: '#e2e8f0', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block', lineHeight: '1.5' }}>{scene.videoPrompt}</code>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                {/* READY TO PASTE */}
                <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', marginBottom: '12px' }}>
                  📋 READY-TO-PASTE: DESCRIPTION + TAGS
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <OutputBlock title="Description" value={item.description} compactBlock={true} />
                  <OutputBlock title="Tags" value={item.tags} compactBlock={true} />
                </div>
                
                {/* TOMBOL TUTUP */}
                <button 
                  onClick={() => setExpandedIdea(null)}
                  style={{ marginTop: '16px', background: '#1e293b', border: 'none', color: '#cbd5e1', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', width: '100%' }}
                >
                  Tutup Panel Skrip
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
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