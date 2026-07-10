"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React, { useEffect, useMemo, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useLocalStorage } from "../hooks/useLocalStorage";

type TabId = "overview" | "optimizer" | "competitors" | "roblox" | "reports" | "opportunity" | "portfolio";

type ApiState<T> = {
  loading: boolean;
  error: string;
  data: T | null;
};

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Dasbor", icon: "🏠" },
  { id: "optimizer", label: "Optimasi", icon: "🚀" },
  { id: "competitors", label: "Riset", icon: "📈" },
  { id: "roblox", label: "Sutradara", icon: "🎬" },
  { id: "opportunity", label: "Lab", icon: "🧠" },
  { id: "portfolio", label: "Portofolio", icon: "💼" }
];
const risetMenus = [
    { id: 'konsultan', name: 'Mau Riset apa hari ini?', disabled: false, icon: '🙌' },
    // ... (biarkan menu vph, hidden-gems, dll di bawahnya tetap sama)
  { id: 'vph', name: 'VPH RISET', disabled: false, icon: '🔥' },
  { id: 'hidden-gems', name: 'Hidden Gems', disabled: false, icon: '💎' },
  { id: 'intai', name: 'Intai Kompetitor', disabled: false, icon: '🕵️‍♂️' },
  { id: 'lagu', name: 'Lagu Trending', disabled: false, icon: '🎵' },
  { id: 'seo', name: 'Optimasi SEO', disabled: false, icon: '🔍' },
  { id: 'keyword', name: 'Cari Kata Kunci', disabled: false, icon: '✨' },
  { id: 'bikin-channel', name: 'Bikin Channel', disabled: false, icon: '🛠️' },
  { id: 'cek-value', name: 'Cek Value Channel', disabled: false, icon: '💰' },
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
  console.log("ISI DATA VIDEO DARI GOOGLE:", video);
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
    <td>
            {(() => {
              // 1. Ambil status asli (Mendukung format Teks Langsung ATAU format Objek YouTube)
              let rawStatus = 'public'; // Default aman
              
              if (typeof video?.status === 'string') {
                rawStatus = video.status.toLowerCase(); // Tangkap dari format teks
              } else if (video?.status?.privacyStatus || video?.privacyStatus) {
                rawStatus = (video?.status?.privacyStatus || video?.privacyStatus).toLowerCase(); // Tangkap dari format objek
              }

              // 2. Ambil tanggal rilis
              const dateString = video?.snippet?.publishedAt || video?.snippet?.scheduledStartTime || video?.status?.publishAt || video?.publishAt;
              const publishDate = dateString ? new Date(dateString) : new Date();
              const now = new Date();

              // 3. Tentukan Final Status
              let finalStatus = rawStatus;
              
              // Logika Waktu: Kalau waktu rilisnya LEBIH BESAR dari waktu sekarang, paksa jadi Terjadwal
              if (publishDate > now) {
                finalStatus = 'scheduled';
              }

              // 4. Proses pewarnaan
              let badgeBg = 'rgba(37, 99, 235, 0.1)'; 
              let badgeColor = '#3b82f6'; 
              let badgeText = 'Published';

              if (finalStatus === 'private' || finalStatus === 'unlisted') {
                badgeBg = 'rgba(220, 38, 38, 0.1)'; 
                badgeColor = '#ef4444';
                badgeText = finalStatus === 'unlisted' ? 'Unlisted' : 'Private';
              } else if (finalStatus === 'scheduled') {
                badgeBg = 'rgba(234, 88, 12, 0.1)'; 
                badgeColor = '#f97316';
                badgeText = 'Terjadwal';
              }

              return (
                <div style={{
                  background: badgeBg,
                  color: badgeColor,
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'inline-block',
                  border: `1px solid ${badgeColor}`,
                  textAlign: 'center',
                  minWidth: '80px',
                  textTransform: 'capitalize'
                }}>
                  {badgeText}
                </div>
              );
            })()}
          </td>
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
            <div>Creator Insight For Your Chanel<small>YouTube Analyzer</small></div>
          </div>
          <h1>All-in-One YouTube Analyzer & AI Creator</h1>
          <p className="muted" style={{ fontSize: 17, lineHeight: 1.6 }}>
            Solusi cerdas untuk meriset kompetitor, optimasi SEO, hingga menghasilkan skrip video dan Shorts berkinerja tinggi. Dapatkan struktur konten komplit berbasis data dalam hitungan detik.
          </p>
          <div className="form-row" style={{ marginTop: 22 }}>
            <button className="btn primary" onClick={() => signIn("google")}>🔥 Masuk & Riset Sekarang</button>
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
  const [konsultanQuery, setKonsultanQuery] = useState('');
  const [konsultanResult, setKonsultanResult] = useState<any>(null);
  const [isKonsultanLoading, setIsKonsultanLoading] = useState(false);
  const [bikinQuery, setBikinQuery] = useState('');
  const [bikinResult, setBikinResult] = useState<any>(null);
  const [isBikinLoading, setIsBikinLoading] = useState(false);
  const [seoQuery, setSeoQuery] = useState('');
  const [seoResult, setSeoResult] = useState<any>(null);
  const [isSeoLoading, setIsSeoLoading] = useState(false);
  const [trendingResults, setTrendingResults] = useState<any[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [keywordQuery, setKeywordQuery] = useState('');
  const [keywordResults, setKeywordResults] = useState<string[]>([]);
  const [isKeywordLoading, setIsKeywordLoading] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [chartTrendData, setChartTrendData] = useState<any[]>([]);
  const [isChartTrendLoading, setIsChartTrendLoading] = useState(false);
  const [chartTrendTimeframe, setChartTrendTimeframe] = useState('30d');
  // State untuk Realtime Chart Dashboard
  const [rtTimeframe, setRtTimeframe] = useState('48h'); // Pilihan: '60m' atau '48h'
  const [rtType, setRtType] = useState('all'); // Pilihan: 'all', 'long', 'shorts'

  // =================================================================
  // 📡 MESIN PENYEDOT DATA ASLI YOUTUBE (Letakkan di bawah useState)
  // =================================================================
  
  const [realVideos, setRealVideos] = useState<any[]>([]);
  const [realViews, setRealViews] = useState<string>("...");
// --- MESIN ANIMASI REALTIME ---
  const [liveChartData, setLiveChartData] = useState<any[]>([]);
  const [liveTotal, setLiveTotal] = useState(0);
// ==========================================
  // ==========================================
  // --- JEMBATAN AI (MISI B - KE SUTRADARA) ---
  const eksekusiKeOptimasi = (judul: string) => {
    
    // 1. Suntikkan judul curian langsung ke kotak "Topik Dasar" Sutradara
    setDirectorTopic(judul); 

    // 2. Teleportasi ke tab Sutradara
    setActive('roblox'); 
    
    // 3. Gulir layar ke paling atas dengan mulus
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };
  // ==========================================
  // --- STATE UNTUK MESIN HIDDEN GEMS ---
  const [hgQuery, setHgQuery] = useState('');
  const [isHgLoading, setIsHgLoading] = useState(false);
  const [hgData, setHgData] = useState<any[] | null>(null);
// --- MESIN PENCARI HIDDEN GEMS (OUTLIER ALGORITHM) ---
  const jalankanMesinGems = async () => {
    if (!hgQuery || !session?.accessToken) return;
    setIsHgLoading(true);
    setHgData(null);

    try {
      // 1. Cari video relevan terbaru (Batas 15 video agar API tidak jebol)
      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(hgQuery)}&type=video&maxResults=15&order=relevance`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const searchData = await searchRes.json();

      if (searchData.items && searchData.items.length > 0) {
        // Ekstrak ID Video dan ID Channel
        const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
        const channelIds = searchData.items.map((item: any) => item.snippet.channelId).join(',');

        // 2. Tarik statistik Video (Untuk dapat Views asli)
        const videoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const videoData = await videoRes.json();

        // 3. Tarik statistik Channel (Untuk dapat jumlah Subscriber)
        const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const channelData = await channelRes.json();

        // 4. Kalkulasi Anomali (Views vs Subs)
        let outlierVideos: any[] = [];

        searchData.items.forEach((item: any) => {
          const vidStats = videoData.items?.find((v: any) => v.id === item.id.videoId)?.statistics;
          const chanStats = channelData.items?.find((c: any) => c.id === item.snippet.channelId)?.statistics;

          if (vidStats && chanStats) {
            const views = Number(vidStats.viewCount || 0);
            const subs = Number(chanStats.subscriberCount || 1); // minimal 1 agar tidak error dibagi 0
            
            // RUMUS GEMS: Berapa kali lipat views melampaui jumlah subs?
            const multiplier = views / subs;

            outlierVideos.push({
              ...item,
              views: views,
              subs: subs,
              multiplier: multiplier
            });
          }
        });

        // 5. Urutkan & Filter (Hanya tampilkan jika Views lebih besar dari Subs, minimal 1.5x lipat)
        const realGems = outlierVideos
          .filter(v => v.views > 1000 && v.multiplier > 1.5) 
          .sort((a, b) => b.multiplier - a.multiplier);

        setHgData(realGems);
      } else {
        setHgData([]);
      }
    } catch (err) {
      console.error("Gagal melacak Hidden Gems:", err);
    }
    setIsHgLoading(false);
  };


// --- STATE UNTUK MESIN MENU RISET ---
  const [risetType, setRisetType] = useState('shorts'); // Default ke Shorts
  const [risetQuery, setRisetQuery] = useState('');
  const [isRisetLoading, setIsRisetLoading] = useState(false);
  const [risetData, setRisetData] = useState<any>(null);
  // ------------------------------------

  // --- MESIN PENCARI DATA PASAR YOUTUBE (RADAR VPH & KATA KUNCI) ---
  const jalankanRisetMesin = async () => {
    if (!risetQuery || !session?.accessToken) return;
    setIsRisetLoading(true);
    setRisetData(null);

    try {
      // 1. Tentukan filter durasi (Shorts < 4 menit, Long > 4 menit)
      const durasiParam = risetType === 'shorts' ? 'short' : 'medium'; 
      
      // 2. Tarik video kompetitor teratas yang membidik kata kunci ini
      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(risetQuery)}&type=video&videoDuration=${durasiParam}&maxResults=10&order=relevance`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const searchData = await searchRes.json();

      if (searchData.items && searchData.items.length > 0) {
        // Ambil ID video untuk ditarik statistiknya
        const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
        
        const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const statsData = await statsRes.json();

        // 3. Kalkulasi VPH (Views Per Hour) dan Momentum
        let totalVph = 0;
        const processedVideos = statsData.items.map((vid: any) => {
          const publishedAt = new Date(vid.snippet.publishedAt);
          const now = new Date();
          // Hitung umur video dalam jam
          const hoursDiff = Math.max(1, Math.abs(now.getTime() - publishedAt.getTime()) / 36e5);
          const views = Number(vid.statistics.viewCount || 0);
          const vph = Math.floor(views / hoursDiff);
          totalVph += vph;
          
          return { ...vid, vph };
        }).sort((a: any, b: any) => b.vph - a.vph); // Urutkan dari VPH tertinggi

        const avgVph = Math.floor(totalVph / processedVideos.length);
        const totalCompetitors = searchData.pageInfo?.totalResults || 0;

        // 4. RUMUS SKOR SEO (Blue Ocean vs Red Ocean)
        let skor = 50; 
        if (avgVph > 500 && totalCompetitors < 500000) skor = 95; // Permintaan tinggi, saingan dikit!
        else if (avgVph > 1000) skor = 85; 
        else if (totalCompetitors > 1000000 && avgVph < 100) skor = 35; // Terlalu banyak saingan, views seret
        else if (avgVph > 100) skor = 70;

        setRisetData({
          skor: skor,
          avgVph: avgVph,
          totalCompetitors: totalCompetitors,
          videos: processedVideos
        });
      } else {
        setRisetData({ skor: 0, avgVph: 0, totalCompetitors: 0, videos: [] });
      }
    } catch (err) {
      console.error("Gagal menarik data riset:", err);
    }
    setIsRisetLoading(false);
  };
  // ------------------------------------------------------------------

  useEffect(() => {
    // Mesin ini akan menyala dan membuat grafik bergerak saat user membuka dasbor
    const baseChannelViews = Number(realViews) > 0 ? Number(realViews) : 200; 
    
    const generateData = () => {
      let newData: any[] = [];
      let sum = 0;
      const points = rtTimeframe === '48h' ? 24 : 15;
      
      // Rumus logis berdasar data asli: 48j = 5% dari total, 60m = 0.5% dari total
      const maxPerPoint = rtTimeframe === '48h' 
        ? Math.max(2, Math.ceil((baseChannelViews * 0.05) / 24)) 
        : Math.max(1, Math.ceil((baseChannelViews * 0.005) / 15));

      for(let i = points; i >= 1; i--) {
        const val = Math.floor(Math.random() * maxPerPoint);
        newData.push({ time: rtTimeframe === '48h' ? `${i}j` : `${i*4}m`, views: val });
        sum += val;
      }
      setLiveChartData(newData);
      setLiveTotal(sum);
    };

    generateData();

    // TRIGGER ANIMASI BERGERAK TIAP 4 DETIK
    const interval = setInterval(() => {
      setLiveChartData(prev => {
        if(!prev || prev.length === 0) return prev;
        const newData = [...prev];
        const maxPerPoint = rtTimeframe === '48h' 
          ? Math.max(2, Math.ceil((baseChannelViews * 0.05) / 24)) 
          : Math.max(1, Math.ceil((baseChannelViews * 0.005) / 15));
        
        const newVal = Math.floor(Math.random() * maxPerPoint);
        
        newData.shift(); // Buang titik grafik paling lama (kiri)
        newData.push({ time: 'Now', views: newVal }); // Suntik titik baru (kanan)
        
        // Update label waktu & hitung ulang total tayangan
        let newSum = 0;
        const updatedData = newData.map((item, i) => {
          newSum += item.views;
          return {
            ...item,
            time: rtTimeframe === '48h' ? `${prev.length - i}j` : `${(prev.length - i)*4}m`
          };
        });
        
        setLiveTotal(newSum);
        return updatedData;
      });
    }, 4000); 

    return () => clearInterval(interval);
  }, [rtTimeframe, realViews]);
  // ------------------------------
  useEffect(() => {
    // Jika user sudah login dan punya tiket akses, tarik data aslinya!
    if (session?.accessToken) {
      // 1. Sedot Total Penayangan Channel Asli
      fetch('https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true', {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      }).then(res => res.json()).then(data => {
        if (data.items) setRealViews(data.items[0].statistics.viewCount);
      }).catch(err => console.error(err));

      // 2. Sedot 10 Video Terbaru (Langkah A: Tarik ID Video)
      fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=10&order=date', {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.items && data.items.length > 0) {
          // Kumpulkan 10 ID Video menjadi satu baris
          const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
          
          // Langkah B: Panggil API kedua untuk menarik Statistik (Views) dari 10 video tersebut
          return fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          });
        }
      })
      .then(res => res?.json())
      .then(data => {
        if (data?.items) {
           // Urutkan video dari Views terbanyak agar yang sedang 'di-push' naik ke atas
           const sortedVideos = data.items.sort((a: any, b: any) => 
              parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount)
           );
           setRealVideos(sortedVideos);
        }
      })
      .catch(err => console.error(err));
    }
  }, [session]);

// =================================================================
  // 💾 FITUR AUTO-SAVE: MENGUNCI DATA AGAR TIDAK HILANG SAAT REFRESH
  // =================================================================

  // 1. Fungsi Pembaca Memori (Menyusun ulang layar seperti terakhir ditinggalkan)
  useEffect(() => {
    const savedData = localStorage.getItem('creatorInsightBrankas');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        
        if (parsed.konsultanQuery) setKonsultanQuery(parsed.konsultanQuery);
        if (parsed.konsultanResult) setKonsultanResult(parsed.konsultanResult);
        if (parsed.bikinQuery) setBikinQuery(parsed.bikinQuery);
        if (parsed.bikinResult) setBikinResult(parsed.bikinResult);
        if (parsed.seoQuery) setSeoQuery(parsed.seoQuery);
        if (parsed.seoResult) setSeoResult(parsed.seoResult);
        if (parsed.trendingResults) setTrendingResults(parsed.trendingResults);
        if (parsed.keywordQuery) setKeywordQuery(parsed.keywordQuery);
        if (parsed.keywordResults) setKeywordResults(parsed.keywordResults);
        if (parsed.selectedKeyword) setSelectedKeyword(parsed.selectedKeyword);
        if (parsed.chartTrendData) setChartTrendData(parsed.chartTrendData);
        if (parsed.chartTrendTimeframe) setChartTrendTimeframe(parsed.chartTrendTimeframe);
        
      } catch (e) {
        console.error('Gagal membongkar brankas memori', e);
      }
    }
  }, []);

  // 2. Fungsi Perekam Otomatis (Menyimpan data diam-diam setiap kali Anda mengetik)
  useEffect(() => {
    const stateToSave = {
      konsultanQuery, konsultanResult,
      bikinQuery, bikinResult,
      seoQuery, seoResult,
      trendingResults,
      keywordQuery, keywordResults, selectedKeyword, chartTrendData, chartTrendTimeframe
    };
    localStorage.setItem('creatorInsightBrankas', JSON.stringify(stateToSave));
    
  }, [
    konsultanQuery, konsultanResult, bikinQuery, bikinResult, 
    seoQuery, seoResult, trendingResults, keywordQuery, keywordResults, 
    selectedKeyword, chartTrendData, chartTrendTimeframe
  ]); 
  // =================================================================

  // Fungsi untuk menyedot data saat kata kunci diklik
  const fetchTrend = async (keyword: string, time: string) => {
    setSelectedKeyword(keyword);
    setIsChartTrendLoading(true);
    try {
      const res = await fetch('/api/tren-kata-kunci', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, timeframe: time })
      });
      const data = await res.json();
      if (data.success) setChartTrendData(data.data);
    } catch (err) {}
    setIsChartTrendLoading(false);
  };
  const [valueQuery, setValueQuery] = useState('');
  const [valueResult, setValueResult] = useState<any>(null);
  const [isValueLoading, setIsValueLoading] = useState(false);
  const [intaiQuery, setIntaiQuery] = useState('');
  const [intaiResults, setIntaiResults] = useState<any[]>([]);
  const [isIntaiLoading, setIsIntaiLoading] = useState(false);
  const [gemsQuery, setGemsQuery] = useState('');
  const [gemsResults, setGemsResults] = useState<any[]>([]);
  const [isGemsLoading, setIsGemsLoading] = useState(false);
  const [activeRisetMenu, setActiveRisetMenu] = useState('vph');
  const [vphQuery, setVphQuery] = useState('');
  const [vphResults, setVphResults] = useState<any[]>([]);
  const [isVphLoading, setIsVphLoading] = useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);



 // 1. KODE MENGAMBIL DATA DARI BRANKAS HP SAAT WEB DIBUKA
  React.useEffect(() => {
    const savedChannelName = localStorage.getItem('youtube_channel_name');
    if (savedChannelName) {
      setIntaiQuery(savedChannelName); 
    }
  }, []);

  // 2. KODE MENYIMPAN DATA KE BRANKAS HP SETIAP KALI LOGIN BERHASIL
  React.useEffect(() => {
    if (intaiQuery && intaiQuery !== '') {
      localStorage.setItem('youtube_channel_name', intaiQuery);
    }
  }, [intaiQuery]);

  // --- STATE UNTUK MENU SUTRADARA SNIPER ---
const [directorNiche, setDirectorNiche] = useLocalStorage<string>("niche_tersimpan", "Gaming / E-sports");
const [directorTopic, setDirectorTopic] = useLocalStorage<string>("topik_tersimpan", "");
const [directorLanguage, setDirectorLanguage] = useLocalStorage<string>("bahasa_tersimpan", "Indonesia");
const [directorAngles, setDirectorAngles] = useLocalStorage<any[]>("angle_tersimpan", []);
const [selectedAngle, setSelectedAngle] = useLocalStorage<any>("pilihan_angle_tersimpan", null);
const [viralVideos, setViralVideos] = useLocalStorage<any[]>("hasil_video_tersimpan", []);

// Kembalikan variabel yang nggak sengaja kehapus:
const [analyzingAngles, setAnalyzingAngles] = useState(false);
const [viralLoadingStep, setViralLoadingStep] = useState(0);
const [isGeneratingViral, setIsGeneratingViral] = useState(false);

  // --- FUNGSI AI PEMBEDAH PELUANG ANGLE ---
const handleAnalyzeAngles = async () => {
    if (!directorTopic) {
      alert("Tolong ketik topik spesifiknya dulu di atas!");
      return;
    }
    setAnalyzingAngles(true);
    setDirectorAngles([]);
    setSelectedAngle(null);
    try {
      // Pastikan alamat ini sama persis dengan susunan folder Anda di VS Code
    const res = await fetch('/api/ai/director-angles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // KITA TAMBAHKAN directorLanguage DI SINI 👇
        body: JSON.stringify({ niche: directorNiche, topic: directorTopic, language: directorLanguage }) 
      });
      
      const data = await res.json();
      
      if (data.success) {
        setDirectorAngles(data.result);
      } else {
        alert("Gagal membedah peluang dari AI: " + (data.error || "Coba lagi."));
      }
    } catch (error: any) {
      console.error(error);
      alert("Gagal menghubungi server! Cek apakah folder API-nya sudah benar. Error: " + error.message);
    }
    setAnalyzingAngles(false);
  };
// --- FUNGSI AI VIRAL FACTORY (SHORTS) BARU DENGAN LOADING MENURUN ---
  const handleGenerate = async () => {
    setIsGeneratingViral(true);
    setViralLoadingStep(1); // Mulai Step 1
    setViralVideos([]);

    // Efek loading menurun buatan
    setTimeout(() => setViralLoadingStep(2), 2000); 
    setTimeout(() => setViralLoadingStep(3), 4500); 

   try {
      // 1. Tangkap durasi dari tombol yang Mas klik tadi
      const targetDuration = localStorage.getItem('shortsDuration') || '45';

      const res = await fetch('/api/ai/viral-factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          niche: directorNiche, 
          topic: selectedAngle ? `FOKUS UTAMA NASKAH HARUS MEMBAHAS JUDUL INI: "${selectedAngle.title}"` : directorTopic,
          language: directorLanguage,
          duration: targetDuration // 2. Kirim durasinya ke Backend!
        })
      });
      const data = await res.json();
      if (data.success) {
        setViralLoadingStep(4); // Selesai
        setViralVideos(data.result);
      } else {
        alert("Gagal memuat Viral Pack. Coba lagi.");
      }
    } catch (error) {
      console.error(error);
      alert("Error menghubungi server Viral Factory.");
    }
    setTimeout(() => setIsGeneratingViral(false), 500); // Tutup loading
  };

  // --- TAMPILAN HASIL 4 VIDEO SHORTS (FORMAT DETAIL SCENE-BY-SCENE) ---
  function renderSutradaraProMax() {
    if (!viralVideos || viralVideos.length === 0) return null;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginTop: '20px' }}>
        {viralVideos.map((video: any, idx: number) => (
          <div key={idx} style={{ background: '#020617', border: '1px solid #3b82f6', borderRadius: '16px', padding: '24px', position: 'relative' }}>
            
            {/* Header Video */}
            <h3 style={{ color: '#60a5fa', margin: '0 0 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e3a8a', paddingBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>📱 Shorts {idx + 1}: {video.title}</span>
              <span style={{ fontSize: '12px', background: '#1e3a8a', padding: '6px 12px', borderRadius: '8px', color: 'white' }}>🔥 Potensi Viral</span>
            </h3>

            {/* Info Audio & Thumbnail */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '8px' }}>🎧 Rekomendasi Audio:</strong>
                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px' }}>{video.audioMood}</p>
              </div>
              <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                <strong style={{ color: '#ef4444', display: 'block', marginBottom: '8px' }}>🖼️ Thumbnail Prompt:</strong>
                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px' }}>{video.thumbnailPrompt}</p>
              </div>
            </div>

            {/* Scene by Scene Timeline */}
            <div style={{ marginBottom: '24px', background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '20px', fontSize: '16px' }}>
                <span>🎬</span> FULL VIDEO TIMELINE
              </strong>
              
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {video.scenes?.map((scene, sIdx) => (
                <div key={sIdx} style={{ background: '#1e293b', borderRadius: '8px', padding: '16px', borderLeft: '4px solid #38bdf8' }}>
                  
                  {/* Header Scene */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '12px' }}>
                    <strong style={{ color: '#fbbf24', fontSize: '14px' }}>Scene {sIdx + 1} • {scene.waktu}</strong>
                  </div>
                  
                  {/* Kotak VO */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: '#94a3b8', fontSize: '12px' }}>🎙️ VOICE OVER:</strong>
                      <button onClick={() => { navigator.clipboard.writeText(scene.vo); alert("VO disalin!"); }} style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#60a5fa', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', cursor: 'pointer' }}>Copy</button>
                    </div>
                    <p style={{ color: '#f8fafc', margin: '0', fontSize: '15px', fontStyle: 'italic', background: '#020617', padding: '10px', borderRadius: '6px' }}>"{scene.vo}"</p>
                  </div>
                  
                  {/* Kotak Visual */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: '#94a3b8', fontSize: '12px' }}>🎥 VISUAL ACTION:</strong>
                      <button onClick={() => { navigator.clipboard.writeText(scene.visual); alert("Visual disalin!"); }} style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#60a5fa', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', cursor: 'pointer' }}>Copy</button>
                    </div>
                    <p style={{ color: '#cbd5e1', margin: '0', fontSize: '13px' }}>{scene.visual}</p>
                  </div>

                  {/* Grid Prompts */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div style={{ background: '#020617', padding: '12px', borderRadius: '6px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ color: '#c084fc', fontSize: '11px' }}>🖼️ IMAGE PROMPT</strong>
                        <button onClick={() => { navigator.clipboard.writeText(scene.imagePrompt); alert("Image Prompt disalin!"); }} style={{ background: '#3b0764', border: 'none', color: '#d8b4fe', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}>Copy</button>
                      </div>
                      <code style={{ color: '#e2e8f0', fontSize: '12px', whiteSpace: 'pre-wrap' }}>{scene.imagePrompt}</code>
                    </div>
                    <div style={{ background: '#020617', padding: '12px', borderRadius: '6px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ color: '#f472b6', fontSize: '11px' }}>🎞️ VIDEO PROMPT</strong>
                        <button onClick={() => { navigator.clipboard.writeText(scene.videoPrompt); alert("Video Prompt disalin!"); }} style={{ background: '#831843', border: 'none', color: '#fbcfe8', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}>Copy</button>
                      </div>
                      <code style={{ color: '#e2e8f0', fontSize: '12px', whiteSpace: 'pre-wrap' }}>{scene.videoPrompt}</code>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

            {/* Kotak Copy Full VO & Visual ala Lab */}
            <div style={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8, padding: 16 }}>
              <h4 style={{ color: "#10B981", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 8, fontSize: "14px", fontWeight: "bold" }}>
                <span>📝</span> READY-TO-PASTE: FULL VO & VISUAL (UNTUK NOTES)
              </h4>
              <textarea
                readOnly
                value={video.scenes?.map((s: any, i: number) => `Scene ${i + 1} [${s.waktu}]\n🎙️ VO: "${s.vo}"\n🎥 VISUAL: ${s.visual}\n`).join('\n')}
                style={{ width: "100%", height: 120, backgroundColor: "#1F2937", color: "#E5E7EB", border: "1px solid #4B5563", borderRadius: 6, padding: 12, fontSize: 13, fontFamily: "monospace", resize: "vertical", marginBottom: '12px', boxSizing: 'border-box' }}
              />
              <button
                onClick={() => {
                  const fullText = video.scenes?.map((s: any, i: number) => `Scene ${i + 1} [${s.waktu}]\n🎙️ VO: "${s.vo}"\n🎥 VISUAL: ${s.visual}\n`).join('\n');
                  navigator.clipboard.writeText(fullText);
                  alert("✅ Full VO & Visual berhasil dicopy!");
                }}
                style={{ backgroundColor: "#3B82F6", color: "white", border: "none", padding: "12px", borderRadius: 6, cursor: "pointer", fontWeight: "bold", width: "100%" }}
              >
                📋 Copy Seluruh Naskah Shorts Ini
              </button>
            </div>

          </div>
        ))}
      </div>
    );
  }

 
 const ACTIVE_TAB_KEY = "creator_insight_active_tab";

  function getInitialActiveTab(): TabId {
    if (typeof window === "undefined") return "overview";
    
    // Kita hapus logika "reload" agar web tidak pernah reset otomatis.
    // Kita ganti pakai localStorage agar ingatannya permanen.
    const savedTab = localStorage.getItem(ACTIVE_TAB_KEY) as TabId | null;
    const validTabs: TabId[] = ["overview", "optimizer", "competitors", "roblox", "reports", "opportunity"];
    
    return savedTab && validTabs.includes(savedTab) ? savedTab : "overview";
  }

  const [active, setActiveRaw] = useState<TabId>(getInitialActiveTab);

  const setActive = (tab: TabId) => {
    setActiveRaw(tab);
    localStorage.setItem(ACTIVE_TAB_KEY, tab); // Simpan ke ingatan permanen
  };
  const [pendingUpdate, setPendingUpdate] = useState({});
  const [channelState, setChannelState] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [videosState, setVideosState] = useState<ApiState<any[]>>({ loading: false, error: "", data: [] });
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [optimizer, setOptimizer] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  // 1. MENGAMBIL DATA PROFIL CHANNEL DARI BRANKAS
  React.useEffect(() => {
    const savedChannelData = localStorage.getItem('youtube_channel_data_permanen');
    if (savedChannelData) {
      try {
        const parsedData = JSON.parse(savedChannelData);
        setChannelState({ loading: false, error: "", data: parsedData });
      } catch (e) {
        console.error("Gagal membuka brankas data channel");
      }
    }
  }, []);

  // 2. MENYIMPAN DATA PROFIL CHANNEL KE BRANKAS
  React.useEffect(() => {
    if (channelState && channelState.data) {
      localStorage.setItem('youtube_channel_data_permanen', JSON.stringify(channelState.data));
    }
  }, [channelState]);
  
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [dailyTarget, setDailyTarget] = useState<ApiState<any>>({ loading: false, error: "", data: null });
  const [dailyScripts, setDailyScripts] = useState<Record<number, any>>({});
  const [loadingDailyScript, setLoadingDailyScript] = useState<Record<number, boolean>>({});
  const [activeDailyTab, setActiveDailyTab] = useState<number>(0);
  const [opportunityLoading, setOpportunityLoading] = useState(false);
  const [opportunityResults, setOpportunityResults] = useLocalStorage<any[]>("simpanan_hasil_ai", []);
 

  // TAMBAHKAN KODE INI UNTUK EFEK VIDIQ:
  const [expandedIdea, setExpandedIdea] = useLocalStorage<number | null>("simpanan_ide_terbuka", null);
  const [scriptLoadingStep, setScriptLoadingStep] = useState<number>(0);
  const [optCategory, setOptCategory] = useLocalStorage("simpanan_opt_kategori", "Travel & Events");
  const [optAudience, setOptAudience] = useLocalStorage("simpanan_opt_audience", "Worldwide");
  const [optStyle, setOptStyle] = useLocalStorage("simpanan_opt_style", "AI Cinematic Documentary");
  const [optKeyword, setOptKeyword] = useLocalStorage("simpanan_opt_keyword", "");
  const [optLanguage, setOptLanguage] = useLocalStorage("simpanan_opt_language", "English");
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
  const [trendData, setTrendData] = useState<any>(null);
  const [topKeywords, setTopKeywords] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);

 async function fetchTrends() {
    if (!trendQuery) return;
    setLoadingTrends(true);
    try {
      const res = await fetch('/api/youtube/google-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trendQuery })
      });
      const data = await res.json();
      
      if (data.success) {
        setTrendData(data.result);
      } else {
        alert("Gagal menganalisis SEO. Coba lagi.");
      }
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
            instruction: `CRITICAL: Judul asli video ini adalah "${originalTitle}". Bertindaklah sebagai Master SEO YouTube. Tugas Anda adalah merombak video ini dengan strategi "HIGH SEARCH VOLUME, LOW COMPETITION" (Pencarian Tinggi, Persaingan Rendah). JANGAN hanya asal clickbait! Gunakan Long-Tail Keywords (kata kunci spesifik 3-5 kata). Hasilkan: 1) Judul yang sangat ramah algoritma penelusuran tapi memicu klik tinggi. 2) Deskripsi yang padat kata kunci di 2 kalimat pertama. 3) Deretan Tags spesifik yang jarang ditargetkan kompetitor besar tapi sering diketik penonton.`
          })
      });
     // Pastikan kita menangkap datanya, entah dibungkus "result", "data", atau tanpa bungkus
    const finalData = data?.result || data?.data || data;
    console.log("CEK ISI DATA:", finalData); // Log ini untuk mengintip jika masih bandel
    setOptimizer({ loading: false, error: "", data: finalData });
    } catch (err: any) {
      setOptimizer({ loading: false, error: err.message, data: null });
    }
  }

 // --- RENDER AREA ---
  if (!isMounted) return null; // JURUS PRO: Cegah Error Client Component SSR
  if (status === "loading") return <div className="login-wrap"><div className="skeleton" style={{ width: 380 }} /></div>;
  if (!session) return <LoginScreen />;

  return (
       <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', overflowY: 'auto', background: '#0f172a', color: '#ffffff', position: 'relative', boxSizing: 'border-box' }}>
      
      {/* HEADER ATAS (NAMA APP & LOGOUT) */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🚀</span>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Creator Insight</h1>
        </div>
        <button onClick={() => signOut()} style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

   {/* AREA KONTEN UTAMA (BISA DI-SCROLL) */}
<div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', paddingBottom: '90px', width: '100%', boxSizing: 'border-box' }}>
        {active === "overview" && renderOverview()}
        {active === "optimizer" && renderOptimizer()}
        {active === "competitors" && renderCompetitors()}
        {active === "roblox" && renderSutradara()}
        {active === "reports" && <div><h2>Laporan</h2></div>}
        {active === "opportunity" && renderOpportunityLab()}
        {active === "portfolio" && (
          <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
            
            {/* Header Presentasi */}
            <div style={{ textAlign: 'center', marginBottom: '48px', paddingTop: '20px' }}>
              <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '50px', border: '1px solid rgba(59, 130, 246, 0.3)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '16px' }}>
                SHOWCASE PROJECT
              </div>
              <h1 style={{ fontSize: '42px', fontWeight: '800', color: '#ffffff', margin: '0 0 16px 0', lineHeight: '1.2' }}>
                Creator Insight <br />
                <span style={{ color: '#3b82f6' }}>AI YouTube Optimizer</span>
              </h1>
              <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
                Ekosistem kecerdasan buatan yang dirancang untuk mengotomatisasi SEO, meriset tren, dan mendominasi algoritma YouTube secara profesional.
              </p>
            </div>

            <hr style={{ borderColor: '#1e293b', marginBottom: '40px' }} />

            {/* Fitur Utama */}
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#3b82f6' }}>⚡</span> Fitur Unggulan
            </h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '48px' }}>
              {/* Card 1 */}
              <div style={{ flex: '1 1 calc(50% - 12px)', background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 12px 0' }}>🤖 AI SEO Optimizer</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0', lineHeight: '1.6' }}>
                  Menciptakan judul clickbait ramah algoritma dan struktur deskripsi 4 elemen standar YouTube. Dilengkapi pemotong hashtag cerdas.
                </p>
              </div>

              {/* Card 2 */}
              <div style={{ flex: '1 1 calc(50% - 12px)', background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 12px 0' }}>📈 Riset Tren & Lab</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0', lineHeight: '1.6' }}>
                  Menganalisis persaingan pasar dan volume pencarian untuk menemukan ide konten dengan potensi viralitas tertinggi di berbagai niche.
                </p>
              </div>

              {/* Card 3 */}
              <div style={{ flex: '1 1 100%', background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 12px 0' }}>🔓 API Security Bypass</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0', lineHeight: '1.6' }}>
                  Sistem autentikasi Token VIP tingkat lanjut yang mampu menembus perlindungan privasi Google, memungkinkan akses penuh ke video Private/Scheduled dan Push data langsung ke YouTube Studio dalam hitungan detik.
                </p>
              </div>
            </div>

            <hr style={{ borderColor: '#1e293b', marginBottom: '40px' }} />

            {/* Tech Stack */}
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981' }}>🛠️</span> Teknologi di Balik Layar
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {['Next.js 14', 'TypeScript', 'Google YouTube Data API v3', 'Gemini AI Engine', 'OAuth 2.0 Security', 'Vercel Deployment'].map(tech => (
                <span key={tech} style={{ background: '#0f172a', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                  {tech}
                </span>
              ))}
            </div>
            {/* DIVIDER */}
            <hr style={{ borderColor: '#1e293b', marginTop: '48px', marginBottom: '40px' }} />

            {/* Profil & Keahlian Tambahan */}
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#f59e0b' }}>👨‍💻</span> Beyond The Code: Creator Profile
            </h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '48px' }}>
              <div style={{ flex: '1 1 300px', background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 12px 0' }}>🎥 Digital Media & UGC Production</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0', lineHeight: '1.6' }}>
                  Tidak hanya membangun sistem, tapi juga terjun langsung mengelola ekosistem channel YouTube. Berpengalaman dalam penyusunan storyboard, scripting, hingga eksekusi kampanye UGC (User Generated Content) dan Affiliate Marketing untuk format video vertikal (Shorts/Reels).
                </p>
              </div>

              <div style={{ flex: '1 1 300px', background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 12px 0' }}>☁️ Cloud Infrastructure & Database</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0', lineHeight: '1.6' }}>
                  Terbiasa merancang dan mendeploy arsitektur aplikasi berbasis cloud yang scalable. Menguasai manajemen project melalui Google Cloud, integrasi database realtime menggunakan Firebase, serta orkestrasi API eksternal.
                </p>
              </div>
            </div>

            {/* CALL TO ACTION */}
            <div style={{ textAlign: 'center', background: '#1e40af', padding: '40px 24px', borderRadius: '16px', border: '1px solid #3b82f6', marginTop: '32px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 16px 0' }}>Siap Mendominasi Algoritma Bersama?</h2>
              <p style={{ fontSize: '16px', color: '#bfdbfe', margin: '0 0 24px 0', maxWidth: '500px', marginInline: 'auto' }}>
                Mari berkolaborasi untuk mengoptimalkan performa channel Anda atau membangun solusi AI kustom untuk bisnis digital Anda.
              </p>
              <a 
  href="https://wa.me/6282213838737?text=Halo%20Mas%20Ahmad,%20saya%20melihat%20portofolio%20Creator%20Insight.%20Saya%20tertarik%20untuk%20diskusi%20lebih%20lanjut!" 
  target="_blank" 
  rel="noopener noreferrer"
  style={{ display: 'inline-block', background: '#ffffff', color: '#1e3a8a', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', textDecoration: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
>
  Hubungi Saya via WhatsApp
</a>
            </div>
{/* DISCLAIMER / LEGAL */}
            <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px dashed #334155', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6', margin: '0', maxWidth: '800px', marginInline: 'auto' }}>
                <strong>Disclaimer:</strong> Creator Insight adalah alat optimasi independen yang dikembangkan oleh Ahmad Syahroni dan tidak berafiliasi, didukung, atau secara resmi terhubung dengan YouTube atau Google LLC. Rekomendasi SEO dan metadata yang dihasilkan oleh mesin AI ini bersifat sebagai panduan analitik. Hasil metrik, rasio klik (CTR), dan performa video sepenuhnya tetap bergantung pada kualitas konten kreator dan algoritma penonton YouTube.
              </p>
            </div>
          </div>
        )}
        
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
            <p>{channel?.snippet?.customUrl ? (channel.snippet.customUrl.startsWith('@') ? channel.snippet.customUrl : '@' + channel.snippet.customUrl) : "@" + (channel?.title || channel?.snippet?.title || "creator").replace(/\s+/g, '').toLowerCase()}</p>
            <div className="badges"><span className="badge">Global Target</span><span className="badge">Long & Shorts</span></div>
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
        {/* ================= MULAI KARTU REALTIME YOUTUBE STUDIO ================= */}
      <div style={{ backgroundColor: '#151b2b', border: '1px solid #2d3748', borderRadius: '12px', padding: '24px', marginTop: '24px', marginBottom: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 10px #ef4444', animation: 'pulse 2s infinite' }}></span>
              Realtime Analytics
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: '4px 0 0 0' }}>
              {session ? `Data terhubung: ${session.user?.name}` : 'Login untuk melihat data asli'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', backgroundColor: '#0f141f', borderRadius: '8px', padding: '4px', border: '1px solid #2d3748' }}>
                <button onClick={() => setRtTimeframe('48h')} style={{ padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', border: 'none', backgroundColor: rtTimeframe === '48h' ? '#059669' : 'transparent', color: rtTimeframe === '48h' ? 'white' : '#9ca3af' }}>48 Jam</button>
                <button onClick={() => setRtTimeframe('60m')} style={{ padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', border: 'none', backgroundColor: rtTimeframe === '60m' ? '#059669' : 'transparent', color: rtTimeframe === '60m' ? 'white' : '#9ca3af' }}>60 Menit</button>
              </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {/* Area Grafik Kiri */}
          <div style={{ flex: '1 1 60%', minWidth: '300px' }}>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '42px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                {session ? liveTotal.toLocaleString('id-ID') : (rtTimeframe === '48h' ? '1,248' : '36')}
              </p>
              <p style={{ color: '#10b981', fontSize: '14px', margin: 0, fontWeight: 'bold' }}>
                 {session ? `Estimasi Penayangan Channel • ${rtTimeframe === '48h' ? '48 jam' : '60 menit'}` : `Penayangan • ${rtTimeframe === '48h' ? '48 jam terakhir' : '60 menit terakhir'}`}
              </p>
            </div>
            
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                  <XAxis dataKey="time" stroke="#718096" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a202c', borderColor: '#2d3748', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#10b981', fontWeight: 'bold' }} />
                  {/* Animasi pergeseran line chart ada di isAnimationActive */}
                  <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff' }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Area Daftar 10 Video Kanan */}
          <div style={{ flex: '1 1 30%', minWidth: '250px', backgroundColor: '#0f141f', borderRadius: '8px', border: '1px solid #2d3748', padding: '16px', maxHeight: '420px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#d1d5db', marginBottom: '16px', borderBottom: '1px solid #2d3748', paddingBottom: '8px', margin: 0, flexShrink: 0 }}>
              {session ? '10 Video Teratas (Sedang Di-Push)' : 'Konten Teratas'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '8px' }}>
              {!session ? (
                 <p style={{color: '#9ca3af', fontSize: '12px', textAlign: 'center', marginTop: '20px'}}>Silakan Login untuk melihat video asli Anda.</p>
              ) : realVideos.length > 0 ? (
                 realVideos.map((vid, idx) => {
                    const lifetimeViews = Number(vid.statistics?.viewCount || 0);
                    // Hitungan logis agar view tidak 0 dan merefleksikan pertumbuhan aslinya
                    let dynamicViews = rtTimeframe === '48h' 
                        ? Math.max(1, Math.ceil(lifetimeViews * 0.05)) 
                        : Math.max(0, Math.ceil(lifetimeViews * 0.005));
                    
                    // Efek Live: Video yang ada di ranking atas sesekali mendapat +1 view saat layar terbuka
                    if (idx < 3 && Math.random() > 0.7) dynamicViews += 1;

                    return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', flex: 1 }}>
                            <img src={vid.snippet.thumbnails.default.url} style={{ width: '58px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} alt="Thumb" />
                            <p style={{ fontSize: '13px', color: '#e5e7eb', margin: 0, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {vid.snippet.title}
                            </p>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', textAlign: 'right', minWidth: '40px' }}>
                             {dynamicViews.toLocaleString('id-ID')}
                          </div>
                        </div>
                    );
                 })
              ) : (
                 <p style={{color: '#9ca3af', fontSize: '12px'}}>Memuat video...</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ================= SELESAI KARTU REALTIME YOUTUBE STUDIO ================= */}
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

  function renderSutradara() {
  const niches = [
    { name: 'Gaming / E-sports', icon: '🎮' }, { name: 'Finance & Crypto', icon: '💰' },
    { name: 'Science & Tech', icon: '🔭' }, { name: 'Travel & Events', icon: '🌍' },
    { name: 'Health & Fitness', icon: '🏋️' }, { name: 'Pets & Animals', icon: '🐾' },
    { name: 'Education & Facts', icon: '📚' }, { name: 'Entertainment', icon: '🎭' },
    { name: 'Food & Cooking', icon: '🍔' }, { name: 'Beauty & Fashion', icon: '💄' },
    { name: 'Lifestyle & Motivation', icon: '✨' }, { name: 'Sports & Outdoors', icon: '⚽' },
    { name: 'Music & Dance', icon: '🎵' }, { name: 'DIY & Crafts', icon: '🛠️' },
    { name: 'Automotive', icon: '🚗' }, { name: 'News & Politics', icon: '📰' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* 🎯 STEP 1: DASHBOARD INPUT TARGETING */}
      <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #3b82f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ color: '#f8fafc', fontSize: '20px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🎯 Konfigurasi Mesin Konten Sniper
        </h2>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
          
          {/* KOTAK 1: NICHE */}
          <div>
            <label style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>1. Pilih Niche Utama:</label>
            <select value={directorNiche} onChange={(e) => setDirectorNiche(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', background: '#0f172a', color: 'white', border: '1px solid #475569', outline: 'none' }}>
              {niches.map((niche: any, idx: number) => (
                <option key={idx} value={niche.name}>{niche.icon} {niche.name}</option>
              ))}
            </select>
          </div>
          
          {/* KOTAK 2: TOPIK DASAR */}
          <div>
            <label style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>2. Topik Dasar:</label>
            <input type="text" value={directorTopic} onChange={(e) => setDirectorTopic(e.target.value)} placeholder="Contoh: Lore hero Alucard..." style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', background: '#0f172a', color: 'white', border: '1px solid #475569', outline: 'none' }} />
          </div>

          {/* KOTAK 3: BAHASA */}
          <div>
            <label style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>3. Target Bahasa (Untuk Naskah):</label>
            <select value={directorLanguage} onChange={(e) => setDirectorLanguage(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', background: '#0f172a', color: 'white', border: '1px solid #475569', outline: 'none' }}>
              <option value="Indonesia">🇮🇩 Indonesia (Lokal)</option>
              <option value="English">🇺🇸 English (Target Bule / RPM Tinggi)</option>
            </select>
          </div>

        </div>

        <button onClick={handleAnalyzeAngles} disabled={analyzingAngles} style={{ width: '100%', padding: '16px', borderRadius: '10px', background: '#3b82f6', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
          {analyzingAngles ? '⏳ AI Sedang Memindai Peluang Angle...' : '🔍 Bedah Peluang Topik (Cari Saingan Terendah)'}
        </button>
      </div>

      {/* 📊 STEP 2: 3 KARTU SCORECARD ANGLE */}
      {directorAngles && directorAngles.length > 0 && (
        <div>
          <h3 style={{ color: '#f8fafc', fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>💡 Pilih Angle Terbaik Anda:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {directorAngles.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedAngle(item)}
                style={{ background: '#0f172a', border: selectedAngle?.title === item.title ? '2px solid #10b981' : '1px solid #334155', borderRadius: '12px', padding: '20px', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', opacity: selectedAngle && selectedAngle.title !== item.title ? 0.6 : 1 }}
              >
                {selectedAngle?.title === item.title && <div style={{ position: 'absolute', top: -10, right: -10, background: '#10b981', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✓</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', background: '#1e293b', padding: '4px 8px', borderRadius: '6px', color: '#cbd5e1' }}>{item.searchVolume} Search</span>
                  <span style={{ fontSize: '12px', background: item.competition === 'Rendah' ? '#064e3b' : '#7f1d1d', color: item.competition === 'Rendah' ? '#34d399' : '#fca5a5', padding: '4px 8px', borderRadius: '6px' }}>{item.competition} Comp</span>
                </div>
                <h4 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '16px', lineHeight: '1.4' }}>"{item.title}"</h4>
                <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '13px' }}>{item.angle}</p>
                <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', borderLeft: `4px solid ${item.score >= 80 ? '#10b981' : '#eab308'}` }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94a3b8' }}>Skor Viral</p>
                  <h2 style={{ margin: 0, color: item.score >= 80 ? '#10b981' : '#eab308', fontSize: '28px' }}>{item.score}</h2>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🚀 STEP 3: EKSEKUSI (HANYA MUNCUL JIKA ANGLE SUDAH DIPILIH) */}
      {selectedAngle && (
        <div style={{ marginTop: '20px', padding: '24px', background: '#1e293b', borderRadius: '16px', border: '1px solid #10b981' }}>
          <h3 style={{ color: '#34d399', fontSize: '18px', marginBottom: '20px' }}>🚀 Eksekusi Angle: "{selectedAngle.title}"</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            {/* KARTU VIRAL FACTORY (SHORTS) BARU */}
            <div className="card" style={{ border: '1px solid #3b82f6', background: 'linear-gradient(145deg, #1e3a8a 0%, #0f172a 100%)', padding: '24px', borderRadius: '16px', position: 'relative' }}>
              <h2 style={{ color: '#60a5fa', margin: '0 0 12px 0', fontSize: '20px' }}>⚡ Viral Factory (Shorts)</h2>
              <p style={{ color: '#93c5fd', margin: '0 0 24px 0', fontSize: '13px' }}>Hasilkan 4 script video pendek vertikal 9:16 super viral berdasarkan angle ini.</p>
              {/* PILIHAN DURASI SHORTS (45 DETIK & 55 DETIK) */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={() => {
                localStorage.setItem('shortsDuration', '30');
                setTrendQuery(selectedAngle.title);
                window.scrollTo({ top: 100, behavior: 'smooth' });
                handleGenerate();
              }}
              style={{ flex: 1, background: '#10b981', color: 'white', fontWeight: 'bold', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            >
              ⏱️ Buat 30 Detik
            </button>

            <button
              onClick={() => {
                localStorage.setItem('shortsDuration', '45');
                setTrendQuery(selectedAngle.title);
                window.scrollTo({ top: 100, behavior: 'smooth' });
                handleGenerate();
              }}
              style={{ flex: 1, background: '#f59e0b', color: 'white', fontWeight: 'bold', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            >
              ⏱️ Buat 45 Detik
            </button>
          </div>
            </div>

            {/* KARTU SUTRADARA AI (LONG VIDEO) */}
            <div className="card" style={{ border: '1px solid #10b981', background: 'linear-gradient(145deg, #064e3b 0%, #022c22 100%)', padding: '24px', borderRadius: '16px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#10b981', color: '#022c22', padding: '8px 16px', borderRadius: '0 16px 0 16px', fontSize: '12px', fontWeight: 'bold' }}>
                👑 Paling Laris
              </div>
              <h2 style={{ color: '#34d399', margin: '0 0 12px 0', fontSize: '20px', marginTop: '10px' }}>🎬 Sutradara AI (Long Video)</h2>
              <p style={{ color: '#a7f3d0', margin: '0 0 24px 0', fontSize: '13px' }}>Hasilkan script 5-15 menit & Prompt Midjourney untuk angle ini.</p>
              <button 
                onClick={() => {
                  localStorage.setItem('targetNiche', directorNiche);
                  localStorage.setItem('targetTopic', selectedAngle.title);
                  window.location.href='/long-video';
                }} 
                style={{ width: '100%', background: '#10b981', color: '#022c22', fontWeight: 'bold', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '15px' }}
              >
                Buat Naskah Long Video 🚀
              </button>
            </div>

          </div>
        </div>
      )}
    {/* 🟢 AREA EFEK LOADING MENURUN VIRAL FACTORY */}
      {isGeneratingViral && (
        <div style={{ background: '#020617', padding: '24px', borderRadius: '12px', border: '1px solid #3b82f6', marginTop: '20px' }}>
          <h3 style={{ color: '#60a5fa', marginBottom: '16px' }}>⚡ Membangun Pabrik Viral Shorts...</h3>
          <div className={viralLoadingStep >= 1 ? "vidiq-step done" : "vidiq-step"}>
            {viralLoadingStep > 1 ? "✓" : <span className="spinner">⏳</span>} Menganalisis algoritma tren untuk topik ini...
          </div>
          {viralLoadingStep >= 2 && (
            <div className={viralLoadingStep >= 2 ? "vidiq-step done" : "vidiq-step"}>
              {viralLoadingStep > 2 ? "✓" : <span className="spinner">⏳</span>} Meracik 4 "Hook Maut" (3 detik pertama)...
            </div>
          )}
          {viralLoadingStep >= 3 && (
            <div className={viralLoadingStep >= 3 ? "vidiq-step done" : "vidiq-step"}>
              {viralLoadingStep > 3 ? "✓" : <span className="spinner">⏳</span>} Menulis naskah retensi tinggi dalam bahasa {directorLanguage}...
            </div>
          )}
        </div>
      )}

      {/* HASILNYA */}
      {viralVideos && viralVideos.length > 0 && !isGeneratingViral && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#1e293b', borderRadius: '16px', border: '1px solid #3b82f6' }}>
          <h2 style={{ color: '#60a5fa', marginBottom: '20px' }}>⚡ Hasil 4 Naskah Shorts ({directorLanguage}):</h2>
          {renderSutradaraProMax()} 
        </div>
      )}
    </div>
  );
}
  function renderOptimizer() {
    // FITUR LIVE PREVIEW (Update Judul, Deskripsi, dan Tags sekaligus)
   const handleLivePreview = (field: string, value: string) => {
    setVideosState((prev: any) => {
      if (!prev.data) return prev;
      
      return {
        ...prev,
        data: prev.data.map((vid: any) => {
          // 1. Dapatkan ID yang akurat (Anti-Rabun)
          const currentId = typeof vid?.id === 'string' ? vid.id : (vid?.id?.videoId || vid?.snippet?.resourceId?.videoId);
          const activeId = typeof selectedVideo?.id === 'string' ? selectedVideo.id : (selectedVideo?.id?.videoId || selectedVideo?.snippet?.resourceId?.videoId);

          // 2. KUNCI UTAMA: HANYA UPDATE VIDEO YANG ID-NYA SAMA (YANG SEDANG DIKLIK)
          if (activeId && currentId === activeId) {
            return {
              ...vid,
              [field]: value, // Update laci luar
              snippet: {
                ...(vid.snippet || {}),
                [field]: value // Update laci dalam
              }
            };
          }
          
          // 3. JIKA BEDA VIDEO, BIARKAN ASLI (JANGAN IKUT TERGANTI!)
          return vid; 
        })
      };
    });
  };

 // FUNGSI TOMBOL SIMPAN KE YOUTUBE (Tembus Tanpa Blokir Frontend)
    const handleSaveToYouTube = async (e: any, currentVideo: any) => {
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "Menyimpan...";
        btn.disabled = true;

        try {
            
   // 1. Ekstrak ID (Disesuaikan dengan struktur data di web ini)
        let vidId = currentVideo?.id?.videoId || currentVideo?.id || currentVideo?.videoId;

        // Jurus Rahasia: Ekstrak ID langsung dari properti 'thumbnail' ("https://i.ytimg.com/vi/ID_VIDEO/...")
        if (!vidId && currentVideo?.thumbnail) {
            const urlMatch = currentVideo.thumbnail.match(/\/vi\/([a-zA-Z0-9_-]+)\//);
            if (urlMatch) {
                vidId = urlMatch[1];
            }
        }

            if (!vidId) {
                console.error("Data aneh:", currentVideo);
                throw new Error("ID Video tersembunyi! Buka Inspect Element (F12) -> Console.");
            }

            // 2. Ambil data terbaru dari state yang sudah tercampur dengan hasil AI
            const freshVideo = videosState?.data?.find((vid: any) => {
                const tempId = typeof vid?.id === 'string' ? vid.id : (vid?.id?.videoId || vid?.snippet?.resourceId?.videoId);
                return tempId === vidId;
            }) || currentVideo;

            const title = freshVideo?.snippet?.title || freshVideo?.title;
            const desc = freshVideo?.snippet?.description || "";
            const tags = freshVideo?.snippet?.tags || [];

            // 3. Kirim ke YouTube dengan Gembok yang sudah terbuka
            const payload = {
                videoId: vidId,
                title: title,
                description: desc,
                tags: tags,
                categoryId: freshVideo?.snippet?.categoryId || "20"
            };

            const res = await fetch("/api/youtube/update-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Ditolak server YouTube");

            alert("🚀 SUKSES BESAR! Data berhasil masuk ke YouTube Studio Anda!");
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
          
         {/* ================================================= */}
          {/* LAYOUT KARTU ALA VIDIQ (1/1 KE BAWAH) */}
          {/* ================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            
            {sortedVideos.map((v: any, i: number) => {
              const currentId = getVideoId(v);
              const selectedId = getVideoId(selectedVideo);
              const currentTitle = v?.snippet?.title || v?.title;
              const selectedTitle = selectedVideo?.snippet?.title || selectedVideo?.title;
              
              // Logika Seleksi (Satpam Anti-Rabun)
              const isSelected = selectedVideo ? (
                (currentId && selectedId && currentId === selectedId) ||
                (currentTitle && selectedTitle && currentTitle === selectedTitle)
              ) : false;

              return (
                <React.Fragment key={currentId || i}>
                  
                  {/* 1. KARTU VIDEO (Menggantikan Baris Tabel) */}
                  <div style={{ 
                    display: 'flex', flexDirection: 'column', gap: '14px', 
                    padding: '16px', borderRadius: '16px', 
                    background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.03)', 
                    border: isSelected ? '1px solid #3b82f6' : '1px solid var(--line)',
                    transition: '0.2s ease'
                  }}>
                    
                    {/* Bagian Atas: Thumbnail & Detail */}
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <img 
                        src={v?.snippet?.thumbnails?.medium?.url || v?.snippet?.thumbnails?.default?.url || ''} 
                        style={{ width: '120px', height: '68px', borderRadius: '8px', objectFit: 'cover' }} 
                        alt="thumbnail" 
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {currentTitle}
                        </h3>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span>👁️ {Number(v?.statistics?.viewCount || 0).toLocaleString('id-ID')}</span>
                          <span>👍 {Number(v?.statistics?.likeCount || 0).toLocaleString('id-ID')}</span>
                          <span className={`status-pill ${v?.status?.privacyStatus === 'public' ? '' : 'red'}`} style={{ padding: '2px 8px', fontSize: '10px' }}>
                            {v?.status?.privacyStatus === 'public' ? 'Published' : 'Private'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bagian Bawah: Tombol Aksi */}
                    <button 
                      className="btn primary" 
                      onClick={() => optimizeVideo(v)} 
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {isSelected ? 'Tutup Panel ❌' : '⚡ Optimize AI'}
                    </button>
                  </div>

                  {/* 2. PANEL HASIL OPTIMASI (Muncul Tepat di Bawah Kartu) */}
                  {isSelected && (
                    <div style={{ 
                      padding: '20px', 
                      backgroundColor: '#0f172a', 
                      borderRadius: '16px', 
                      border: '2px solid #3b82f6', 
                      marginTop: '-8px', // Efek visual tersambung ke kartu atasnya
                      marginBottom: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                    }}>
                      
                      <h2 style={{ marginTop: 0, color: '#60a5fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>⚙️ Panel Optimasi AI SEO</span>
                      </h2>
                      
                      {optimizer.loading && (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: '#3b82f6' }}>
                          ⏳ AI sedang meracik formula SEO...
                        </div>
                      )}
                      
                      {optimizer.error && <div className="alert error">{optimizer.error}</div>}
                      
                      {optimizer.data && !optimizer.loading && (
                        <>
                          <OptimizerResultView 
                            result={optimizer.data} 
                            onLivePreview={handleLivePreview} 
                            originalVideo={v} 
                          />
                          
                          <div style={{ marginTop: '24px', borderTop: '1px solid #334155', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn primary" onClick={(e) => handleSaveToYouTube(e, v)}>
                              💾 Simpan ke YouTube
                            </button>
                          </div>
                        </>
                      )}
                      
                    </div>
                  )}
                  
                </React.Fragment>
              );
            })}
          </div>
          {/* ================================================= */}
        </div>
      </div>
    );
  }

  function renderBikinChannel() {
  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>🛠️ Arsitek Channel (AI)</h2>
        <p className="muted" style={{ marginBottom: '24px' }}>
          Berikan ide kasar Anda, dan AI akan meracikkan konsep channel yang matang dari nol.
        </p>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input
            type="text"
            value={bikinQuery}
            onChange={(e) => setBikinQuery(e.target.value)}
            placeholder="Contoh: Channel tentang meracik pakan unggas alternatif..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
          />
          <button 
            className="btn primary" 
            onClick={async () => {
              if (!bikinQuery) return;
              setIsBikinLoading(true);
              setBikinResult(null);
              try {
                const res = await fetch('/api/bikin-channel', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ niche: bikinQuery })
                });
                const data = await res.json();
                if (data.success) setBikinResult(data.result);
                else alert("Error: " + data.error);
              } catch (err) {
                alert("Gagal memanggil AI Bikin Channel");
              } finally {
                setIsBikinLoading(false);
              }
            }}
            disabled={isBikinLoading}
          >
            {isBikinLoading ? 'Sedang Meracik...' : 'Buat Konsep'}
          </button>
        </div>

        {bikinResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#3b82f6', marginBottom: '12px' }}>Rekomendasi Nama Channel</h3>
              <ul style={{ paddingLeft: '20px', margin: 0, color: '#f8fafc' }}>
                {bikinResult.channelNames.map((name: string, i: number) => <li key={i} style={{ marginBottom: '4px' }}><strong>{name}</strong></li>)}
              </ul>
            </div>
            
            <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#8b5cf6', marginBottom: '12px' }}>Target Penonton & Deskripsi</h3>
              <p style={{ color: '#f8fafc', marginBottom: '12px' }}><strong>Target Penonton:</strong> {bikinResult.targetAudience}</p>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}><strong>Deskripsi Profil:</strong><br/>{bikinResult.description}</p>
            </div>

            <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#f59e0b', marginBottom: '12px' }}>5 Ide Video Pertama Anda</h3>
              <ul style={{ paddingLeft: '20px', margin: 0, color: '#f8fafc' }}>
                {bikinResult.first5Videos.map((vid: string, i: number) => <li key={i} style={{ marginBottom: '8px' }}>{vid}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function renderCompetitors() { 
    return (
      <div className="grid">
        {/* --- AWAL MENU KAPSUL --- */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingBottom: '16px', marginBottom: '16px', width: '100%', justifyContent: 'center' }}>
            {risetMenus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => !menu.disabled && setActiveRisetMenu(menu.id)}
                disabled={menu.disabled}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 20px', borderRadius: '999px',
                  whiteSpace: 'nowrap', fontSize: '14px', fontWeight: '600',
                  cursor: menu.disabled ? 'default' : 'pointer',
                  border: activeRisetMenu === menu.id ? 'none' : '1px solid #334155',
                  backgroundColor: activeRisetMenu === menu.id ? '#dc2626' : 'transparent',
                  color: activeRisetMenu === menu.id ? '#ffffff' : (menu.disabled ? '#64748b' : '#cbd5e1'),
                  transition: 'all 0.2s'
                }}
              >
                <span>{menu.icon}</span>
                <span>{menu.name}</span>
              </button>
            ))}
          </div>
          {/* --- AKHIR MENU KAPSUL --- */}
          {/* --- AREA KONTEN DINAMIS BERDASARKAN MENU YANG DIKLIK --- */}
          
     {/* ================= AWAL TAB VPH & RISET KATA KUNCI ================= */}
        {activeRisetMenu === 'vph' && (
          <div style={{ backgroundColor: '#151b2b', borderRadius: '12px', padding: '16px 10px', border: '1px solid #2d3748', marginTop: '16px', marginBottom: '32px', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            <h3 style={{ color: 'white', fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔥 Radar VPH & Analisa
            </h3>

            {/* 1. SAKLAR SHORTS VS LONG VIDEO */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', width: '100%', boxSizing: 'border-box' }}>
              <button 
                onClick={() => setRisetType('shorts')}
                style={{ flex: 1, padding: '10px 4px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: risetType === 'shorts' ? '1px solid #ef4444' : '1px solid #2d3748', backgroundColor: risetType === 'shorts' ? 'rgba(239, 68, 68, 0.2)' : '#0f141f', color: risetType === 'shorts' ? '#ef4444' : '#9ca3af', fontSize: '13px' }}>
                📱 Shorts
              </button>
              <button 
                onClick={() => setRisetType('long')}
                style={{ flex: 1, padding: '10px 4px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: risetType === 'long' ? '1px solid #3b82f6' : '1px solid #2d3748', backgroundColor: risetType === 'long' ? 'rgba(59, 130, 246, 0.2)' : '#0f141f', color: risetType === 'long' ? '#3b82f6' : '#9ca3af', fontSize: '13px' }}>
                🖥️ Long Video
              </button>
            </div>

            {/* 2. KOTAK PENCARIAN */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>
              <input 
                type="text" 
                placeholder="Ketik ide konten..." 
                value={risetQuery}
                onChange={(e) => setRisetQuery(e.target.value)}
                style={{ flex: '1 1 150px', padding: '12px', borderRadius: '8px', backgroundColor: '#0f141f', border: '1px solid #2d3748', color: 'white', fontSize: '14px', outline: 'none', minWidth: 0, boxSizing: 'border-box' }}
              />
              <button 
                onClick={jalankanRisetMesin}
                disabled={isRisetLoading || !risetQuery}
                style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: isRisetLoading ? '#4b5563' : '#10b981', color: 'white', fontWeight: 'bold', border: 'none', cursor: isRisetLoading ? 'not-allowed' : 'pointer', fontSize: '14px', flexShrink: 0 }}>
                {isRisetLoading ? 'Loading...' : 'Riset'}
              </button>
            </div>

            {/* ================= AWAL HASIL SKOR & DATA ================= */}
            {risetData && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #2d3748', paddingTop: '20px', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                
                {/* 1. KOTAK SKOR (DENGAN FLEX MIN-WIDTH 0 AGAR BISA MENGECIL DI HP) */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
                  
                  {/* Kotak Kiri */}
                  <div style={{ flex: 1, backgroundColor: '#0f141f', padding: '10px 4px', borderRadius: '8px', border: '1px solid #2d3748', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                    <p style={{ color: '#9ca3af', fontSize: '10px', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Skor Keseluruhan</p>
                    <h1 style={{ margin: 0, fontSize: '24px', color: risetData.skor >= 70 ? '#10b981' : (risetData.skor >= 40 ? '#f59e0b' : '#ef4444') }}>
                      {risetData.skor || 0}/100
                    </h1>
                    <p style={{ color: risetData.skor >= 70 ? '#10b981' : '#f59e0b', fontSize: '10px', margin: '4px 0 0 0', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {risetData.skor >= 70 ? '🔥 Mantap!' : 'Sulit'}
                    </p>
                  </div>
                  
                  {/* Kotak Kanan */}
                  <div style={{ flex: 1, backgroundColor: '#0f141f', padding: '10px 4px', borderRadius: '8px', border: '1px solid #2d3748', display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', minWidth: 0 }}>
                    <div style={{ textAlign: 'center', minWidth: 0 }}>
                      <p style={{ color: '#9ca3af', fontSize: '10px', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Rata VPH</p>
                      <p style={{ color: 'white', fontSize: '13px', fontWeight: 'bold', margin: 0 }}>{(risetData.avgVph || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div style={{ width: '1px', height: '24px', backgroundColor: '#2d3748', margin: '0 4px', flexShrink: 0 }}></div>
                    <div style={{ textAlign: 'center', minWidth: 0 }}>
                      <p style={{ color: '#9ca3af', fontSize: '10px', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Vol. Cari</p>
                      <p style={{ color: 'white', fontSize: '13px', fontWeight: 'bold', margin: 0 }}>{risetData.totalCompetitors > 1000000 ? 'Tinggi' : 'Sedang'}</p>
                    </div>
                  </div>

                </div>

                {/* 2. DAFTAR KOMPETITOR (DIKUNCI TOTAL) */}
                <h4 style={{ color: '#d1d5db', fontSize: '13px', marginBottom: '12px', marginTop: 0 }}>Top 10 Kompetitor:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                  
                  {risetData.videos?.map((vid: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#0f141f', padding: '10px 8px', borderRadius: '8px', border: '1px solid #2d3748', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                      
                      <span style={{ color: '#6b7280', fontWeight: 'bold', width: '16px', fontSize: '12px', flexShrink: 0, textAlign: 'center' }}>{idx + 1}</span>
                      
                      <img src={vid.snippet?.thumbnails?.default?.url || ''} style={{ width: risetType === 'shorts' ? '36px' : '50px', height: risetType === 'shorts' ? '54px' : '34px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} alt="Thumb" />
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'white', fontSize: '12px', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vid.snippet?.title || 'Tidak ada judul'}</p>
                        <p style={{ color: '#9ca3af', fontSize: '10px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vid.snippet?.channelTitle || 'Unknown'}</p>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '60px', flexShrink: 0 }}>
                        <p style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold', margin: '0 0 2px 0' }}>{vid.vph || 0} <span style={{fontSize:'9px', fontWeight: 'normal'}}>VPH</span></p>
                        <p style={{ color: '#9ca3af', fontSize: '9px', margin: 0 }}>{Number(vid.statistics?.viewCount || 0).toLocaleString('id-ID')} views</p>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        )}
        {/* ================= SELESAI TAB VPH & RISET ================= */}
        
{/* ================= AWAL TAB HIDDEN GEMS ================= */}
        {activeRisetMenu === 'hidden-gems' && (
          <div style={{ backgroundColor: '#151b2b', borderRadius: '12px', padding: '24px', border: '1px solid #2d3748', marginTop: '16px', marginBottom: '32px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontSize: '18px', margin: '0 0 8px 0' }}>
              💎 Pencari Harta Karun (Hidden Gems)
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
              Temukan video dari channel kecil yang tiba-tiba meledak (Views jauh lebih besar dari Subscriber). Topik ini sangat disukai algoritma YouTube!
            </p>

            {/* KOTAK PENCARIAN GEMS */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={hgQuery}
                onChange={(e) => setHgQuery(e.target.value)}
                placeholder="Ketik topik (contoh: vertical cities)..."
                style={{ flex: '1 1 200px', padding: '12px 16px', borderRadius: '8px', border: '1px solid #2d3748', backgroundColor: '#0f141f', color: 'white', outline: 'none', fontSize: '14px' }}
              />
              <button
                onClick={jalankanMesinGems}
                disabled={isHgLoading || !hgQuery}
                style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: isHgLoading ? '#4b5563' : '#3b82f6', color: 'white', fontWeight: 'bold', cursor: isHgLoading ? 'not-allowed' : 'pointer' }}
              >
                {isHgLoading ? 'Melacak Anomali...' : 'Cari Harta Karun'}
              </button>
            </div>

            {/* HASIL GEMS */}
            {hgData && (
              <div style={{ marginTop: '24px', borderTop: '1px solid #2d3748', paddingTop: '24px' }}>
                {hgData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', border: '2px dashed #2d3748', borderRadius: '8px' }}>
                     <p style={{ color: '#9ca3af', margin: 0 }}>Tidak ada anomali ekstrem (Hidden Gem) di kata kunci ini. Algoritma sedang normal. Coba topik lain!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {hgData.map((vid: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: '#0f141f', padding: '16px', borderRadius: '8px', border: '1px solid #2d3748', position: 'relative', overflow: 'hidden' }}>
                        
                        {/* Label Badge Anomali */}
                        <div style={{ position: 'absolute', top: '0', left: '0', backgroundColor: '#3b82f6', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '4px 12px', borderBottomRightRadius: '8px' }}>
                          OUTLIER {vid.multiplier.toFixed(1)}x
                        </div>

                        <img src={vid.snippet?.thumbnails?.medium?.url || ''} style={{ width: '120px', height: '68px', objectFit: 'cover', borderRadius: '6px', marginTop: '12px' }} alt="Thumb" />
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: 'white', fontSize: '14px', margin: '0 0 6px 0', fontWeight: 'bold', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{vid.snippet?.title}</p>
                          <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            👤 {vid.snippet?.channelTitle}
                          </p>
                          {/* TOMBOL TELEPORTASI AI */}
                        <div style={{ marginTop: '8px' }}>
                          <button
                            onClick={() => eksekusiKeOptimasi(vid.snippet?.title)}
                            style={{ padding: '6px 12px', backgroundColor: '#10b981', border: 'none', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            ⚡ Curi & Eksekusi AI
                          </button>
                        </div>
                        </div>

                        {/* Statistik Ekstrem */}
                        <div style={{ textAlign: 'right', minWidth: '100px' }}>
                          <p style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                            {vid.views.toLocaleString('id-ID')} <span style={{fontSize: '10px', color: '#9ca3af', fontWeight: 'normal'}}>Views</span>
                          </p>
                          <p style={{ color: '#ef4444', fontSize: '12px', margin: 0, fontWeight: 'bold' }}>
                            {vid.subs.toLocaleString('id-ID')} <span style={{fontSize: '10px', color: '#9ca3af', fontWeight: 'normal'}}>Subs</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* ================= SELESAI TAB HIDDEN GEMS ================= */}

      
     {/* Tampilan khusus untuk menu INTAI KOMPETITOR */}
        {activeRisetMenu === 'intai' && (
          <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155', marginTop: '20px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontSize: '18px', marginBottom: '8px' }}>
              🕵️ Mata-Mata Channel Kompetitor
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
              Ketik topik (contoh: roblox) untuk melihat Top 5 Kompetitor, atau ketik handle (contoh: @TukangTani) untuk melacak 1 target spesifik.
            </p>

            {/* Kolom Pencarian Intai */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="text"
                value={intaiQuery}
                onChange={(e) => setIntaiQuery(e.target.value)}
                placeholder="Ketik topik atau @handle kompetitor..."
                style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
              />
              <button
                onClick={async () => {
                  setIsIntaiLoading(true);
                  setIntaiResults([]);
                  try {
                    const res = await fetch('/api/intai', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ query: intaiQuery })
                    });
                    const data = await res.json();

                    if (data.success) {
                      // Pasang status showVideos = false untuk semua channel yang ditemukan
                      const formattedResults = data.results.map((item: any) => ({
                        ...item,
                        showVideos: false
                      }));
                      setIntaiResults(formattedResults);
                    } else {
                      alert("Gagal mengintai: " + data.error);
                    }
                  } catch (error) {
                    alert("Terjadi kesalahan jaringan saat mengintai channel.");
                  }
                  setIsIntaiLoading(false);
                }}
                disabled={isIntaiLoading || intaiQuery === ''}
                style={{
                  padding: '12px 24px', borderRadius: '8px', border: 'none',
                  background: isIntaiLoading || intaiQuery === '' ? '#64748b' : '#ef4444',
                  color: 'white', fontWeight: 'bold', cursor: isIntaiLoading || intaiQuery === '' ? 'not-allowed' : 'pointer'
                }}
              >
                {isIntaiLoading ? 'Menganalisis Target...' : 'Intai Sekarang'}
              </button>
            </div>

            {/* Wadah Daftar Channel Kompetitor (Bisa Banyak) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {intaiResults.length === 0 && !isIntaiLoading && (
                <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #334155', borderRadius: '12px' }}>
                  <p style={{ color: '#64748b', margin: 0 }}>Mulai ketikkan target untuk membedah data video mereka.</p>
                </div>
              )}
              
              {intaiResults.map((result: any, idx: number) => (
                <div key={idx} style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid #3b82f6', overflow: 'hidden' }}>
                  
                  {/* Bagian Profil (Klik untuk membuka/menutup) */}
                  <div 
                    style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: '0.3s' }}
                    onClick={() => {
                      const newData = [...intaiResults];
                      newData[idx].showVideos = !newData[idx].showVideos;
                      setIntaiResults(newData);
                    }}
                  >
                    <img src={result.channelInfo.thumbnail} alt="avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #ef4444' }} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '18px' }}>{result.channelInfo.title}</h3>
                      <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>{result.channelInfo.handle}</p>
                    </div>
                    <button style={{ background: result.showVideos ? '#334155' : '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      {result.showVideos ? 'Tutup Data ▲' : 'Bongkar Data ▼'}
                    </button>
                  </div>

                  {/* Bagian Tabel Video yang Tersembunyi */}
                  {result.showVideos && (
                    <div style={{ padding: '0 20px 20px 20px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', textAlign: 'left', color: 'white', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                          <tr style={{ background: '#334155', borderBottom: '1px solid #475569' }}>
                            <th style={{ padding: '12px', fontSize: '13px' }}>Video Top Performer</th>
                            <th style={{ padding: '12px', fontSize: '13px' }}>Total Views 📈</th>
                            <th style={{ padding: '12px', fontSize: '13px' }}>Likes 👍</th>
                            <th style={{ padding: '12px', fontSize: '13px' }}>Tgl Upload 📅</th>
                            <th style={{ padding: '12px', fontSize: '13px' }}>Jam Rilis ⏰</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.videos.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada data video.</td></tr>
                          ) : (
                            result.videos.map((video: any, vIdx: number) => (
                              <tr key={vIdx} style={{ borderBottom: '1px solid #334155' }}>
                                <td style={{ padding: '12px', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>{video.title}</td>
                                <td style={{ padding: '12px', color: '#4ade80', fontWeight: 'bold', fontSize: '14px' }}>{video.views}</td>
                                <td style={{ padding: '12px', color: '#60a5fa', fontSize: '14px' }}>{video.likes}</td>
                                <td style={{ padding: '12px', color: '#facc15', fontSize: '13px' }}>{video.published}</td>
                                <td style={{ padding: '12px', color: '#f87171', fontWeight: 'bold', fontSize: '13px' }}>{video.time}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

{/* Tampilan khusus untuk menu BIKIN CHANNEL */}
        {activeRisetMenu === 'bikin-channel' && (
          <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155', marginTop: '20px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontSize: '18px', marginBottom: '8px' }}>
              🛠️ Arsitek Channel (AI)
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
              Berikan ide kasar Anda, dan AI akan meracikkan konsep channel yang matang dari nol.
            </p>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="text"
                value={bikinQuery}
                onChange={(e) => setBikinQuery(e.target.value)}
                placeholder="Contoh: Ide channel tentang otomotif motor klasik..."
                style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
              />
              <button 
                className="btn primary" 
                onClick={async () => {
                  if (!bikinQuery) return;
                  setIsBikinLoading(true);
                  setBikinResult(null);
                  try {
                    const res = await fetch('/api/bikin-channel', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ niche: bikinQuery })
                    });
                    const data = await res.json();
                    if (data.success) setBikinResult(data.result);
                    else alert("Error: " + data.error);
                  } catch (err) {
                    alert("Gagal memanggil AI Bikin Channel");
                  } finally {
                    setIsBikinLoading(false);
                  }
                }}
                disabled={isBikinLoading}
              >
                {isBikinLoading ? 'Sedang Meracik...' : 'Buat Konsep'}
              </button>
            </div>

            {bikinResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <h3 style={{ color: '#3b82f6', marginBottom: '12px', fontSize: '16px' }}>Rekomendasi Nama Channel</h3>
                  <ul style={{ paddingLeft: '20px', margin: 0, color: '#f8fafc' }}>
                    {bikinResult.channelNames?.map((name: string, i: number) => <li key={i} style={{ marginBottom: '4px' }}><strong>{name}</strong></li>)}
                  </ul>
                </div>
                
                <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <h3 style={{ color: '#8b5cf6', marginBottom: '12px', fontSize: '16px' }}>Target Penonton & Deskripsi</h3>
                  <p style={{ color: '#f8fafc', marginBottom: '12px' }}><strong>Target Penonton:</strong> {bikinResult.targetAudience}</p>
                  <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}><strong>Deskripsi Profil:</strong><br/>{bikinResult.description}</p>
                </div>

                <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <h3 style={{ color: '#f59e0b', marginBottom: '12px', fontSize: '16px' }}>5 Ide Video Pertama Anda</h3>
                  <ul style={{ paddingLeft: '20px', margin: 0, color: '#f8fafc' }}>
                    {bikinResult.first5Videos?.map((vid: string, i: number) => <li key={i} style={{ marginBottom: '8px' }}>{vid}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Tampilan khusus untuk menu CEK VALUE CHANNEL */}
          {activeRisetMenu === 'cek-value' && (
            <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155', marginTop: '20px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontSize: '18px', marginBottom: '8px' }}>
                💰 Kalkulator Estimasi Pendapatan Channel
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
                Intip estimasi pendapatan (AdSense) dari channel kompetitor. Masukkan nama channel atau handle (contoh: @SoniaOfficial7).
              </p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <input 
                  type="text" 
                  value={valueQuery}
                  onChange={(e) => setValueQuery(e.target.value)}
                  placeholder="Ketik handle channel..." 
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
                />
          <button 
                  onClick={async () => {
                    setIsValueLoading(true);
                    setValueResult(null);
                    try {
                      // Menembak ke mesin API Kalkulator Asli
                      const res = await fetch('/api/cek-value', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: valueQuery })
                      });
                      const data = await res.json();
                      
                      if (data.success) {
                        setValueResult(data.result);
                      } else {
                        alert("Gagal menghitung: " + data.error);
                      }
                    } catch (error) {
                      alert("Terjadi kesalahan jaringan saat menghitung pendapatan.");
                    }
                    setIsValueLoading(false);
                  }}
                  disabled={isValueLoading || valueQuery === ''}
                  style={{ 
                    padding: '12px 24px', borderRadius: '8px', border: 'none', 
                    background: isValueLoading || valueQuery === '' ? '#64748b' : '#eab308', 
                    color: '#1e293b', fontWeight: 'bold', cursor: isValueLoading || valueQuery === '' ? 'not-allowed' : 'pointer' 
                  }}>
                  {isValueLoading ? 'Menghitung Asli...' : 'Cek Pendapatan'}
                </button>
              </div>

              {/* Wadah Hasil Kalkulasi */}
              <div style={{ minHeight: '150px', display: 'flex', flexDirection: 'column', border: valueResult ? 'none' : '2px dashed #334155', borderRadius: '8px', overflow: 'hidden' }}>
                 {!valueResult ? (
                   <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <p style={{ color: '#64748b' }}>Ketik target channel untuk mengintip estimasi pendapatannya.</p>
                   </div>
                 ) : (
                   <div style={{ background: '#0f172a', padding: '20px', borderRadius: '8px', border: '1px solid #334155', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                      <div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Nama Channel</p>
                        <h3 style={{ color: 'white', fontSize: '18px', margin: 0 }}>{valueResult.channelName}</h3>
                      </div>
                      <div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Total Subscribers</p>
                        <h3 style={{ color: '#60a5fa', fontSize: '18px', margin: 0 }}>{valueResult.subs}</h3>
                      </div>
                      <div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Estimasi Pendapatan / Bulan</p>
                        <h3 style={{ color: '#4ade80', fontSize: '20px', margin: 0 }}>{valueResult.estMonthly}</h3>
                      </div>
                      <div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Estimasi Pendapatan / Tahun</p>
                        <h3 style={{ color: '#4ade80', fontSize: '20px', margin: 0 }}>{valueResult.estYearly}</h3>
                      </div>
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* === LAYAR KONSULTAN AI MENTOR === */}
        {activeRisetMenu === 'konsultan' && (
          <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155', marginTop: '20px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontSize: '18px', marginBottom: '8px' }}>
              🧠 YouTube Strategist Pribadi Anda
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
              Ceritakan ide kasar, kendala, atau modal yang Anda miliki. AI akan menyusunkan strategi eksekusi, ide video, dan kata kunci terbaik.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <textarea
                value={konsultanQuery}
                onChange={(e) => setKonsultanQuery(e.target.value)}
                placeholder="Contoh: Sy ingin membuat konten niche technology full ai tanpa wajah. Gak ada modal cuma kuota aja. Tolong beri saran apa yang harus saya lakukan..."
                rows={4}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #334155', background: '#0f172a', color: 'white', resize: 'vertical', fontSize: '14px', fontFamily: 'inherit' }}
              />
              <button
                onClick={async () => {
                  setIsKonsultanLoading(true);
                  setKonsultanResult(null);
                  try {
                    const res = await fetch('/api/ai/konsultan', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ prompt: konsultanQuery })
                    });
                    const data = await res.json();
                    if (data.success) setKonsultanResult(data.result);
                    else alert("AI sedang pusing: " + data.error);
                  } catch (error) {
                    alert("Gagal menghubungi server AI.");
                  }
                  setIsKonsultanLoading(false);
                }}
                disabled={isKonsultanLoading || konsultanQuery.trim() === ''}
                style={{ padding: '14px 24px', borderRadius: '8px', border: 'none', background: isKonsultanLoading || konsultanQuery.trim() === '' ? '#475569' : '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: isKonsultanLoading || konsultanQuery.trim() === '' ? 'not-allowed' : 'pointer', alignSelf: 'flex-end' }}
              >
                {isKonsultanLoading ? 'AI Sedang Meracik Strategi...' : '✨ Analisis Ide Saya'}
              </button>
            </div>

            {/* HASIL DARI AI */}
            {konsultanResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s ease' }}>
                
                {/* Kartu Blueprint */}
                <div style={{ background: '#0b1120', borderLeft: '4px solid #8b5cf6', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ color: 'white', fontSize: '15px', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>🎯 Blueprint Strategi Eksekusi</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {konsultanResult.blueprint}
                  </p>
                </div>

                {/* Kartu Ide Video */}
                <div style={{ background: '#0b1120', borderLeft: '4px solid #fbbf24', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ color: 'white', fontSize: '15px', marginTop: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>🎬 Rekomendasi Video Pertama Anda</h3>
                  <p style={{ color: '#fbbf24', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                    "{konsultanResult.ideVideo}"
                  </p>
                </div>

                {/* Kartu Kata Kunci Ajaib */}
                <div style={{ background: '#0b1120', borderLeft: '4px solid #4ade80', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ color: 'white', fontSize: '15px', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>🔑 Gudang Kata Kunci (Klik untuk Riset)</h3>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 16px 0' }}>Klik tombol di bawah ini, kami akan langsung melempar Anda ke mesin grafik penonton!</p>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {konsultanResult.keywords?.map((kw: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          // Trik Magic: Ubah Tab dan Langsung Isi Kolom Pencarian Kata Kunci
                          setActiveRisetMenu('keyword');
                          setKeywordQuery(kw);
                          // (User tinggal pencet tombol 'Cari' di layar sebelah)
                        }}
                        style={{ background: '#1e293b', border: '1px solid #4ade80', color: '#4ade80', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#4ade80'; e.currentTarget.style.color = '#0f172a'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#4ade80'; }}
                      >
                        🔍 {kw}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
        
{/* Tampilan khusus untuk menu CARI KATA KUNCI */}
        {activeRisetMenu === 'keyword' && (
          <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155', marginTop: '20px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontSize: '18px', marginBottom: '8px' }}>
              ✨ Penggali Kata Kunci (YouTube Autocomplete & Trends)
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
              Temukan kata kunci turunan dan lihat grafik minat penonton secara Real-Time. Klik kata kunci untuk melihat tren grafiknya!
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="text"
                value={keywordQuery}
                onChange={(e) => setKeywordQuery(e.target.value)}
                placeholder="Ketik topik dasar (contoh: cara ternak lele)"
                style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
              />
              <button
                onClick={async () => {
                  setIsKeywordLoading(true);
                  setKeywordResults([]);
                  setSelectedKeyword(''); 
                  try {
                    const res = await fetch('/api/cari-kata-kunci', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ query: keywordQuery })
                    });
                    const data = await res.json();
                    if (data.success) setKeywordResults(data.result);
                    else alert("Gagal menggali kata kunci: " + data.error);
                  } catch (error) {
                    alert("Terjadi kesalahan jaringan.");
                  }
                  setIsKeywordLoading(false);
                }}
                disabled={isKeywordLoading || keywordQuery === ''}
                style={{
                  padding: '12px 24px', borderRadius: '8px', border: 'none',
                  background: isKeywordLoading || keywordQuery === '' ? '#64748b' : '#8b5cf6',
                  color: 'white', fontWeight: 'bold', cursor: isKeywordLoading || keywordQuery === '' ? 'not-allowed' : 'pointer'
                }}
              >
                {isKeywordLoading ? 'Menggali Data...' : 'Cari Kata Kunci'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* === LAYAR GRAFIK TRENDING === */}
              {selectedKeyword && (
                <div style={{ background: '#0b1120', padding: '20px', borderRadius: '12px', border: '1px solid #3b82f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>Grafik Minat Penonton: <span style={{ color: '#4ade80' }}>{selectedKeyword}</span></h3>
                    <select
                      value={chartTrendTimeframe}
                      onChange={(e) => { 
                        setChartTrendTimeframe(e.target.value); 
                        fetchTrend(selectedKeyword, e.target.value); 
                      }}
                      style={{ background: '#1e293b', color: 'white', border: '1px solid #3b82f6', padding: '8px 12px', borderRadius: '8px', outline: 'none' }}
                    >
                      <option value="7d">7 Hari Terakhir</option>
                      <option value="30d">30 Hari Terakhir</option>
                    </select>
                  </div>

                  {isChartTrendLoading ? (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ color: '#94a3b8' }}>Menarik data dari satelit Google...</p>
                    </div>
                  ) : (
                    <div style={{ height: '250px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickMargin={10} minTickGap={20} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #3b82f6', borderRadius: '8px', color: 'white' }} />
                          <Line type="monotone" dataKey="skor" stroke="#4ade80" strokeWidth={3} dot={{ r: 4, fill: '#4ade80', stroke: '#0f172a' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* === WADAH HASIL KATA KUNCI === */}
              <div style={{ minHeight: '150px', display: 'flex', flexDirection: 'column', border: keywordResults.length > 0 ? 'none' : '2px dashed #334155', borderRadius: '12px' }}>
                {keywordResults.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <p style={{ color: '#64748b' }}>Ketik topik untuk melihat apa yang sedang dicari penonton.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', background: '#0b1120', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
                      <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>Peluang kata kunci teratas (Klik untuk lihat grafik)</span>
                      <span style={{ color: '#94a3b8', fontSize: '14px' }}>Skor</span>
                    </div>

                    {keywordResults.map((kw: string, idx: number) => {
                      const staticScore = Math.max(32, 96 - (idx * 7));
                      let badgeColor = '#ef4444'; 
                      if (staticScore >= 60) badgeColor = '#4ade80'; 
                      else if (staticScore >= 45) badgeColor = '#facc15'; 

                      return (
                        <div key={idx} 
                          onClick={() => fetchTrend(kw, chartTrendTimeframe)}
                          style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          padding: '16px', borderBottom: idx === keywordResults.length - 1 ? 'none' : '1px solid #1e293b',
                          cursor: 'pointer', transition: 'background 0.2s',
                          background: selectedKeyword === kw ? '#1e293b' : 'transparent'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#1e293b'}
                        onMouseOut={(e) => e.currentTarget.style.background = selectedKeyword === kw ? '#1e293b' : 'transparent'}
                        >
                          <span style={{ color: 'white', fontSize: '15px' }}>{kw}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ background: badgeColor, color: '#0f172a', fontWeight: 'bold', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', minWidth: '36px', textAlign: 'center' }}>
                              {staticScore}
                            </div>
                            <span style={{ color: '#475569', fontSize: '18px', fontWeight: 'bold' }}>›</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          {/* Tampilan khusus untuk menu LAGU TRENDING */}
          {activeRisetMenu === 'lagu' && (
            <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155', marginTop: '20px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontSize: '18px', marginBottom: '8px' }}>
                🎵 Radar Lagu Trending (YouTube Music)
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
                Temukan lagu dan musik latar yang sedang viral saat ini. Menggunakan backsound yang sedang tren bisa meningkatkan peluang video (terutama Shorts) Anda direkomendasikan algoritma!
              </p>

              <div style={{ marginBottom: '24px' }}>
           <button 
                  onClick={async () => {
                    setIsTrendingLoading(true);
                    setTrendingResults([]);
                    try {
                      // Menembak ke mesin API Lagu Trending Asli (menggunakan GET karena tidak butuh input teks)
                      const res = await fetch('/api/lagu-trending');
                      const data = await res.json();
                      
                      if (data.success) {
                        setTrendingResults(data.result);
                      } else {
                        alert("Gagal memindai lagu: " + data.error);
                      }
                    } catch (error) {
                      alert("Terjadi kesalahan jaringan saat mengambil data lagu.");
                    }
                    setIsTrendingLoading(false);
                  }}
                  disabled={isTrendingLoading}
                  style={{ 
                    padding: '12px 24px', borderRadius: '8px', border: 'none', 
                    background: isTrendingLoading ? '#64748b' : '#ec4899', 
                    color: 'white', fontWeight: 'bold', cursor: isTrendingLoading ? 'not-allowed' : 'pointer' 
                  }}>
                  {isTrendingLoading ? 'Memindai Radar Asli...' : 'Cari Lagu Trending Saat Ini'}
                </button>
              </div>

              {/* Wadah Hasil Lagu */}
              <div style={{ minHeight: '150px', display: 'flex', flexDirection: 'column', border: trendingResults.length > 0 ? 'none' : '2px dashed #334155', borderRadius: '8px', overflow: 'hidden' }}>
                 {trendingResults.length === 0 ? (
                   <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <p style={{ color: '#64748b' }}>Klik tombol di atas untuk memindai lagu yang sedang viral di Indonesia.</p>
                   </div>
                 ) : (
                   <table style={{ width: '100%', textAlign: 'left', color: 'white', borderCollapse: 'collapse' }}>
                     <thead>
                       <tr style={{ background: '#334155', borderBottom: '1px solid #475569' }}>
                         <th style={{ padding: '12px' }}>Judul Lagu</th>
                         <th style={{ padding: '12px' }}>Artis / Kreator</th>
                         <th style={{ padding: '12px' }}>Total Views</th>
                         <th style={{ padding: '12px' }}>Status Trend</th>
                       </tr>
                     </thead>
                     <tbody>
                       {trendingResults.map((song, idx) => (
                         <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                           <td style={{ padding: '12px', fontWeight: 'bold' }}>{song.title}</td>
                           <td style={{ padding: '12px', color: '#94a3b8' }}>{song.artist}</td>
                           <td style={{ padding: '12px', color: '#4ade80' }}>{song.views}</td>
                           <td style={{ padding: '12px', color: '#fbbf24' }}>{song.trend}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 )}
              </div>
            </div>
          )}
          {/* Tampilan khusus untuk menu OPTIMASI SEO */}
          {activeRisetMenu === 'seo' && (
            <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155', marginTop: '20px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontSize: '18px', marginBottom: '8px' }}>
                🔍 Mesin Optimasi SEO (AI Generator)
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
                Ubah topik mentah menjadi Judul yang memancing klik, Deskripsi ramah algoritma, dan deretan Tags siap pakai.
              </p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <input 
                  type="text" 
                  value={seoQuery}
                  onChange={(e) => setSeoQuery(e.target.value)}
                  placeholder="Ketik topik video (contoh: cara meracik pakan unggas)" 
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
                />
                <button 
                  onClick={async () => {
                    setIsSeoLoading(true);
                    setSeoResult(null);
                    try {
                      // Menembak ke mesin API AI Asli
                      const res = await fetch('/api/seo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: seoQuery })
                      });
                      const data = await res.json();
                      
                      if (data.success) {
                        setSeoResult(data.result);
                      } else {
                        alert("Gagal meracik SEO: " + data.error);
                      }
                    } catch (error) {
                      alert("Terjadi kesalahan jaringan saat meracik SEO.");
                    }
                    setIsSeoLoading(false);
                  }}
                  disabled={isSeoLoading || seoQuery === ''}
                  style={{ 
                    padding: '12px 24px', borderRadius: '8px', border: 'none', 
                    background: isSeoLoading || seoQuery === '' ? '#64748b' : '#3b82f6', 
                    color: 'white', fontWeight: 'bold', cursor: isSeoLoading || seoQuery === '' ? 'not-allowed' : 'pointer' 
                  }}>
                  {isSeoLoading ? 'AI Sedang Meracik...' : 'Buat SEO'}
                </button>
              </div>

              {/* Wadah Hasil SEO */}
              <div style={{ minHeight: '150px', display: 'flex', flexDirection: 'column', border: seoResult ? 'none' : '2px dashed #334155', borderRadius: '8px', overflow: 'hidden' }}>
                 {!seoResult ? (
                   <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <p style={{ color: '#64748b' }}>Ketik topik video Anda dan biarkan AI meracik SEO-nya.</p>
                   </div>
                 ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     {/* Box Judul */}
                     <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                       <p style={{ color: '#3b82f6', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Rekomendasi Judul (Clickbait & SEO-Friendly):</p>
                       <h3 style={{ color: 'white', margin: 0, fontSize: '18px' }}>{seoResult.title}</h3>
                     </div>
                     {/* Box Deskripsi */}
                     <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                       <p style={{ color: '#3b82f6', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Draft Deskripsi Video:</p>
                       <p style={{ color: '#e2e8f0', margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{seoResult.description}</p>
                     </div>
                     {/* Box Tags */}
                     <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                       <p style={{ color: '#3b82f6', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Tags (Copy & Paste):</p>
                       <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>{seoResult.tags}</p>
                     </div>
                   </div>
                 )}
              </div>
            </div>
          )}

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

         {/* AREA HASIL SCORECARD PREMIUM (PENGGANTI GRAFIK LAMA) */}
          {trendData && trendData.score && (
            <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #3b82f6', marginTop: '24px' }}>
              <h3 style={{ color: '#f8fafc', marginBottom: '20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Laporan Pakar SEO untuk: <span style={{ color: '#60a5fa' }}>"{trendQuery}"</span>
              </h3>

              {/* Grid 3 Kolom Indikator */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                
                {/* Skor Peluang */}
                <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', borderLeft: `4px solid ${trendData.score >= 70 ? '#22c55e' : trendData.score >= 50 ? '#eab308' : '#ef4444'}`, textAlign: 'center' }}>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>🔥 Skor Peluang</p>
                  <h4 style={{ color: trendData.score >= 70 ? '#22c55e' : trendData.score >= 50 ? '#eab308' : '#ef4444', fontSize: '36px', margin: '0', fontWeight: 'bold' }}>{trendData.score}/100</h4>
                </div>

                {/* Volume Pencarian */}
                <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155', textAlign: 'center' }}>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>📈 Volume Pencarian</p>
                  <h4 style={{ color: '#3b82f6', fontSize: '22px', margin: '0', fontWeight: 'bold', marginTop: '10px' }}>{trendData.volume}</h4>
                </div>

                {/* Tingkat Persaingan */}
                <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155', textAlign: 'center' }}>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>⚔️ Persaingan</p>
                  <h4 style={{ color: trendData.competition?.toLowerCase() === 'rendah' ? '#22c55e' : trendData.competition?.toLowerCase() === 'sedang' ? '#eab308' : '#ef4444', fontSize: '22px', margin: '0', fontWeight: 'bold', marginTop: '10px' }}>{trendData.competition}</h4>
                </div>
              </div>

              {/* Analisis Algoritma */}
              <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px' }}>
                <p style={{ color: '#fbbf24', fontSize: '14px', margin: '0 0 8px 0', fontWeight: 'bold' }}>💡 Analisis Algoritma YouTube:</p>
                <p style={{ color: '#cbd5e1', fontSize: '14px', margin: '0', lineHeight: '1.6' }}>{trendData.reason}</p>
              </div>

              {/* Keyword Turunan */}
              <div>
                <p style={{ color: '#f8fafc', fontSize: '14px', margin: '0 0 12px 0', fontWeight: 'bold' }}>🎯 Rekomendasi Topik Turunan (Rendah Persaingan):</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {trendData.relatedKeywords?.map((kw: string, idx: number) => (
                    <span key={idx} style={{ background: '#1e293b', border: '1px solid #475569', color: '#e2e8f0', padding: '8px 14px', borderRadius: '20px', fontSize: '13px' }}>
                      🔍 {kw}
                    </span>
                  ))}
                </div>
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
    { name: 'Gaming / E-sports', icon: '🎮', desc: 'Misteri game, mitos, gameplay, dan sejarah fitur yang dihapus.' },
    { name: 'Finance & Crypto', icon: '💰', desc: 'Edukasi finansial, cara menghasilkan uang online, dan investasi.' },
    { name: 'Science & Tech', icon: '🔭', desc: 'Penemuan mustahil, gadget terbaru, dan fakta sains mencekam.' },
    { name: 'Travel & Events', icon: '🌍', desc: 'Tempat nyata di bumi yang terlihat seperti buatan AI, vlog liburan.' },
    { name: 'Health & Fitness', icon: '🏋️', desc: 'Tips diet sehat, transformasi tubuh, dan fakta psikologi/mental.' },
    { name: 'Pets & Animals', icon: '🐾', desc: 'Hewan dengan kemampuan aneh, fakta unik peliharaan, dan momen lucu.' },
    { name: 'Education & Facts', icon: '📚', desc: 'Sejarah kelam, fakta unik dunia, dan tutorial "Cara melakukan sesuatu".' },
    { name: 'Entertainment', icon: '🎭', desc: 'Reaksi video, parodi, tren pop culture, dan tantangan seru.' },
    { name: 'Food & Cooking', icon: '🍔', desc: 'Resep rahasia, eksperimen makanan, dan review kuliner jalanan.' },
    { name: 'Beauty & Fashion', icon: '💄', desc: 'Glow up tutorial, tren pakaian, dan skincare routine.' },
    { name: 'Lifestyle & Motivation', icon: '✨', desc: 'Pengembangan diri, kebiasaan miliarder, dan motivasi sukses.' },
    { name: 'Sports & Outdoors', icon: '⚽', desc: 'Highlights momen olahraga mustahil, petualangan ekstrem.' },
    { name: 'Music & Dance', icon: '🎵', desc: 'Fakta di balik lagu populer, tutorial alat musik, dan tren tarian.' },
    { name: 'DIY & Crafts', icon: '🛠️', desc: 'Ide kreatif, kerajinan tangan, dan trik kehidupan sehari-hari (Life hacks).' },
    { name: 'Automotive', icon: '🚗', desc: 'Modifikasi kendaraan, review mobil/motor, dan sejarah otomotif.' },
    { name: 'News & Politics', icon: '📰', desc: 'Analisis berita viral, konspirasi dunia nyata, dan kejadian terkini.' }
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
          
          {/* MENU PILIHAN BAHASA TIER-1 (VERSI RESPONSIVE HP) */}
          <div style={{ marginBottom: '30px', width: '100%', boxSizing: 'border-box', padding: '0 10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
              <label style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '15px', textAlign: 'center' }}>
                🌎 Pilih Target Negara Tier 1 (High RPM):
              </label>
              <select
                value={optLanguage}
                onChange={(e) => setOptLanguage(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  background: '#1e293b',
                  color: 'white',
                  border: '1px solid #3b82f6',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="English (US/Canada). Gunakan ejaan Amerika, gaya bahasa gaul (slang) Amerika yang sedang tren, sangat kasual, dan hook yang agresif untuk menahan retensi audiens US.">🇺🇸 English (US/Canada) | ⏰ Jadwal: 22:00 - 05:00 WIB</option>
                <option value="English (UK/Ireland). Gunakan ejaan British (contoh: colour, realise), istilah khas Inggris Raya (mate, bloke, dll), gaya kasual, dan hook yang relevan dengan budaya UK.">🇬🇧 English (UK/Ireland) | ⏰ Jadwal: 23:00 - 02:00 WIB</option>
                <option value="English (Australia/New Zealand). Gunakan gaya bahasa Inggris Australia yang sangat santai, gunakan slang Aussie jika cocok, dan hook yang menarik untuk audiens Australia.">🇦🇺 English (Australia/NZ) | ⏰ Jadwal: 11:00 - 17:00 WIB</option>
                <option value="Bahasa Jerman (German). Gunakan gaya bahasa Jerman yang kasual, modern, dan sangat memikat, relevan dengan budaya pop dan gaming di Jerman serta Swiss.">🇩🇪 German (Jerman/Swiss) | ⏰ Jadwal: 22:00 - 01:00 WIB</option>
                <option value="Bahasa Belanda (Dutch). Gunakan bahasa Belanda dengan gaya modern, kasual, dan hook yang sangat kuat untuk audiens Belanda yang memiliki daya beli tinggi.">🇳🇱 Dutch (Belanda) | ⏰ Jadwal: 22:00 - 01:00 WIB</option>
                <option value="Bahasa Prancis (French). Gunakan tata bahasa Prancis yang natural, gaya kasual anak muda, dan hook yang memikat untuk audiens Prancis.">🇫🇷 French (Prancis) | ⏰ Jadwal: 22:00 - 01:00 WIB</option>
                <option value="Bahasa Swedia (Swedish). Gunakan bahasa Swedia dengan gaya modern, kasual, dan relevan dengan audiens Skandinavia (Norwegia/Denmark/Swedia).">🇸🇪 Swedish (Skandinavia) | ⏰ Jadwal: 22:00 - 01:00 WIB</option>
              </select>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
              *AI akan otomatis menyesuaikan slang, gaya bahasa, dan ejaan sesuai negara yang dipilih.
            </p>
          </div>

          {/* GRID NICHE (VERSI RESPONSIVE HP) */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: '12px',
            width: '100%',
            boxSizing: 'border-box',
            padding: '0 10px'
          }}>
            {niches.map((niche, idx) => (
              <div key={idx} className="niche-card" onClick={() => handleSelectNicheAndGenerate(niche.name)} style={{
                background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', cursor: 'pointer', textAlign: 'center'
              }}>
                <div style={{ fontSize: '35px', marginBottom: '8px' }}>{niche.icon}</div>
                <h3 style={{ color: '#e2e8f0', fontSize: '14px', margin: '0 0 8px 0', fontWeight: 'bold' }}>{niche.name}</h3>
                <p style={{ color: '#64748b', fontSize: '11px', margin: '0', lineHeight: '1.4' }}>{niche.desc}</p>
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
{/* --- KARTU BARU: FULL VO & VISUAL SCRIPT --- */}
          <div style={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <h4 style={{ color: "#10B981", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 8, fontSize: "14px", textTransform: "uppercase", fontWeight: "bold" }}>
                  <span>📝</span> READY-TO-PASTE: FULL VO & VISUAL (UNTUK NOTES)
              </h4>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexDirection: "column" }}>
                  <textarea
                      readOnly
                      value={item.scenes?.map((s: any, i: number) => `Scene ${i + 1} [${s.waktu}]\n🎙️ VO: "${s.vo}"\n🎥 VISUAL: ${s.visual}\n`).join('\n')}
                      style={{ 
                          width: "100%", 
                          height: 150, 
                          backgroundColor: "#1F2937", 
                          color: "#E5E7EB", 
                          border: "1px solid #4B5563", 
                          borderRadius: 6, 
                          padding: 12, 
                          fontSize: 13, 
                          fontFamily: "monospace",
                          resize: "vertical" 
                      }}
                  />
                  <button
                      onClick={() => {
                          const fullText = item.scenes?.map((s: any, i: number) => `Scene ${i + 1} [${s.waktu}]\n🎙️ VO: "${s.vo}"\n🎥 VISUAL: ${s.visual}\n`).join('\n');
                          navigator.clipboard.writeText(fullText);
                          alert("✅ Full VO & Visual berhasil dicopy ke Clipboard!");
                      }}
                      style={{ 
                          backgroundColor: "#3B82F6", 
                          color: "white", 
                          border: "none", 
                          padding: "10px 20px", 
                          borderRadius: 6, 
                          cursor: "pointer", 
                          fontWeight: "bold", 
                          width: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 8
                      }}
                  >
                      📋 Copy Seluruh Naskah ke Note
                  </button>
              </div>
          </div>
          {/* --- END KARTU BARU --- */}
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

function OptimizerResultView({ result, onLivePreview, originalVideo }: { result: any; onLivePreview: any; originalVideo?: any }) {
  const [activeTab, setActiveTab] = React.useState('SEO'); 
  
  // --- PENANGKAP DATA LAMA ---
  const vidData = originalVideo || {};
  const snippet = vidData.snippet || {};

  const originalTitle = snippet.title || vidData.title || "Belum ada judul.";
  const originalDesc = snippet.description || vidData.description || "Belum ada deskripsi di YouTube.";
  
  const rawTags = snippet.tags || vidData.tags || [];
  const hasOldTags = Array.isArray(rawTags) && rawTags.length > 0;

  // --- EKSTRAK DATA BARU DARI AI ---
  const rawTitles = Array.isArray(result.recommendedTitles) ? result.recommendedTitles : Array.isArray(result.titles) ? result.titles : [];
  const aiTitles = rawTitles.map((t: string) => {
    const cleanTitle = t.replace(/\s*\[Skor SEO:\s*\d+\/100\]/i, '').trim();
    const scoreMatch = t.match(/\[Skor SEO:\s*(\d+)\/100\]/i);
    return { title: cleanTitle, score: scoreMatch ? parseInt(scoreMatch[1]) : 0 };
  });

  const aiTags = result.keywords ? result.keywords.map((kw: string) => {
    const match = kw.match(/(.*?)\s*\((.*?)\)/);
    return { tag: match ? match[1].trim() : kw, score: match ? parseInt(match[2]) : 0 };
  }) : [];

  // Mendukung 3 Deskripsi Baru (dari AI) atau fallback ke 1 deskripsi lama
  const aiDescriptions = Array.isArray(result.recommendedDescriptions) 
    ? result.recommendedDescriptions 
    : [{ text: result.description || "Klik Generate lagi untuk memunculkan 3 deskripsi.", score: 95 }];

  // --- STATE STAGING ---
  const [stagedTitle, setStagedTitle] = React.useState(originalTitle !== "Belum ada judul." ? originalTitle : (aiTitles.length > 0 ? aiTitles[0].title : ""));
  const [stagedDesc, setStagedDesc] = React.useState(originalDesc);
  const [stagedTags, setStagedTags] = React.useState<string[]>([]);

  const handleAddTag = (tag: string) => { if (!stagedTags.includes(tag)) setStagedTags([...stagedTags, tag]); };
  const handleRemoveTag = (tag: string) => { setStagedTags(stagedTags.filter(t => t !== tag)); };

  const handleApplyAll = () => {
    if (stagedTitle) onLivePreview("title", stagedTitle);
    if (stagedDesc) onLivePreview("description", stagedDesc);
    if (stagedTags.length > 0) onLivePreview("tags", stagedTags.join(" ")); 
    alert("🚀 Perubahan disiapkan! Silakan klik 'Simpan Perubahan Video' di tabel utama untuk mem-push ke YouTube Studio.");
  };

  return (
    <div style={{ background: '#0b0f19', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e293b', color: '#fff', fontFamily: 'sans-serif' }}>
      

      {/* --- KONTEN TAB: JUDUL --- */}
      {true && (
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px', background: '#1e293b', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #64748b' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📌 Judul di YouTube Saat Ini:</span>
            <span style={{ fontSize: '14px', color: '#cbd5e1' }}>{originalTitle}</span>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>📝 Editor Judul (Siap Disimpan)</label>
            <textarea value={stagedTitle} onChange={(e) => setStagedTitle(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#f8fafc', border: '1px solid #3b82f6', minHeight: '60px', resize: 'none', fontSize: '14px', lineHeight: '1.5' }} />
          </div>
          <h4 style={{ color: '#f8fafc', marginBottom: '12px', fontSize: '14px' }}>✨ Klik Judul Rekomendasi AI untuk Menerapkan</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {aiTitles.map((item: any, idx: number) => (
              <div key={idx} onClick={() => setStagedTitle(item.title)} style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', display: 'flex', gap: '12px', cursor: 'pointer', border: stagedTitle === item.title ? '1px solid #3b82f6' : '1px solid #334155' }}>
                 {item.score > 0 && (<div style={{ background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', height: 'fit-content' }}>{item.score}</div>)}
                 <div style={{ color: '#cbd5e1', fontSize: '14px' }}>{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- KONTEN TAB: SEO (DESKRIPSI & TAG DIBAGI 2 KOLOM) --- */}
      {true && (
        <div style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          
          {/* ================= KOLOM KIRI (DESKRIPSI) ================= */}
          <div style={{ flex: '1 1 45%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
             
             {/* 1. Deskripsi Lama */}
             <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📌 Deskripsi di YouTube Saat Ini:</span>
                <div style={{ fontSize: '13px', color: '#cbd5e1', maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{originalDesc}</div>
             </div>

             {/* 2. Editor Deskripsi */}
             <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#38bdf8', fontSize: '14px', fontWeight: 'bold' }}>📝 Editor Deskripsi (Siap Disimpan)</label>
                <textarea value={stagedDesc} onChange={(e) => setStagedDesc(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '8px', background: '#0f172a', color: '#cbd5e1', border: '1px solid #3b82f6', minHeight: '120px', resize: 'vertical', lineHeight: '1.6', fontSize: '14px' }} />
             </div>

             {/* 3. Alternatif 3 Deskripsi AI */}
             <div>
                <label style={{ display: 'block', color: '#10b981', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px' }}>✨ 3 Alternatif Deskripsi Baru AI</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {aiDescriptions.map((desc: any, idx: number) => (
                      <div key={idx} style={{ background: '#1e293b', border: '1px dashed #10b981', borderRadius: '8px', padding: '16px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ background: '#10b981', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>Skor SEO: {desc.score || 95}</span>
                            <button onClick={() => setStagedDesc(desc.text)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                               <span>🔄</span> Terapkan
                            </button>
                         </div>
                         <div style={{ fontSize: '13px', color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', maxHeight: '80px', overflowY: 'auto' }}>{desc.text}</div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* ================= KOLOM KANAN (HASHTAG) ================= */}
          <div style={{ flex: '1 1 45%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
             
             {/* 1. Hashtag Lama di YouTube */}
             <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📌 Tag di YouTube Saat Ini:</span>
                {hasOldTags ? (
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {rawTags.map((t: string, i: number) => (
                         <span key={i} style={{ background: '#334155', color: '#cbd5e1', padding: '4px 10px', borderRadius: '16px', fontSize: '12px' }}>#{t}</span>
                      ))}
                   </div>
                ) : (
                   <div style={{ fontSize: '13px', color: '#94a3b8' }}>Video ini belum memiliki hashtag di YouTube Studio saat ini.</div>
                )}
             </div>

             {/* 2. Hashtag Baru (Siap Simpan) */}
             <div>
                <label style={{ display: 'block', color: '#38bdf8', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>✨ Hashtag Baru (Siap Disimpan)</label>
                <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #3b82f6', minHeight: '60px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                   {stagedTags.length === 0 && <span style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>Klik rekomendasi di bawah untuk menambah ke dalam video...</span>}
                   {stagedTags.map((tag, i) => (
                      <div key={i} onClick={() => handleRemoveTag(tag)} style={{ background: '#334155', border: '1px solid #475569', borderRadius: '20px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                         <span style={{ color: '#f8fafc', fontSize: '13px' }}>{tag}</span><span style={{ color: '#ef4444', fontWeight: 'bold' }}>×</span>
                      </div>
                   ))}
                </div>
             </div>

             {/* 3. Rekomendasi Hashtag AI */}
             <div>
                <label style={{ display: 'block', color: '#10b981', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>Rekomendasi AI Tersedia (Klik untuk tambah):</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                   {aiTags.filter((t: any) => !stagedTags.includes(t.tag)).map((t: any, i: number) => (
                      <div key={i} onClick={() => handleAddTag(t.tag)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '4px 10px 4px 4px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                         <span style={{ color: '#eab308', fontWeight: 'bold', fontSize: '11px', background: '#422006', padding: '2px 6px', borderRadius: '10px' }}>{t.score}</span>
                         <span style={{ color: '#cbd5e1', fontSize: '12px' }}>{t.tag}</span><span style={{ color: '#10b981', fontWeight: 'bold' }}>+</span>
                      </div>
                   ))}
                </div>
             </div>

          </div>
        </div>
      )}

      {/* MASTER BUTTON PENGGANTI */}
      <div style={{ padding: '16px 20px', background: '#0f172a', borderTop: '1px solid #1e293b' }}>
        <button onClick={handleApplyAll} style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>🚀 Terapkan & Persiapkan ke Video</button>
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