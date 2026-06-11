"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

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
        <div className="feature-list">
          <div className="feature"><b>1. Channel Login</b><br />Baca channel dan video milikmu dengan YouTube readonly.</div>
          <div className="feature"><b>2. Video Optimizer</b><br />Generate title, deskripsi, caption, hashtags, keyword, CTA.</div>
          <div className="feature"><b>3. Competitor Research</b><br />Search channel kompetitor dan lihat pola video mereka.</div>
          <div className="feature"><b>4. Roblox Shorts Creator</b><br />Search update Roblox, pilih topik, generate script 45-60 detik lengkap dengan gameplay direction.</div>
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

  async function optimizeVideo(video: any) {
    setSelectedVideo(video);
    setOptimizer({ loading: true, error: "", data: null });
    try {
      const data = await fetchJson("/api/ai/optimize-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video })
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
          Koboi/OpenAI-compatible gateway aktif jika env AI sudah benar.
          <div style={{ marginTop: 12 }}><button className="btn block" onClick={() => setActive("roblox")}>Create Roblox Shorts</button></div>
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
              <span className="badge">YouTube</span>
              <span className="badge">Roblox Shorts</span>
              <span className="badge">Read-only</span>
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
                <h3>Channel kamu sudah siap dioptimasi.</h3>
                <p className="muted">Pertahankan konsistensi upload, perkuat hook 3 detik pertama, dan optimalkan SEO judul/deskripsi/hashtag.</p>
                <button className="btn primary" onClick={() => setActive("optimizer")}>Lihat Rekomendasi →</button>
              </div>
            </div>
          </div>
          <div className="grid grid-3">
            <div className="mini-score"><span className="muted">Growth Score</span><br /><b>86</b><div className="status-pill">Bagus</div></div>
            <div className="mini-score"><span className="muted">SEO Score</span><br /><b>90</b><div className="status-pill">Sangat Bagus</div></div>
            <div className="mini-score"><span className="muted">Viral Potential</span><br /><b>88</b><div className="status-pill">Tinggi</div></div>
          </div>
        </section>

        <section className="grid grid-2">
          <div className="card">
            <h2>Performance Overview</h2>
            <div className="grid grid-4">
              <div className="mini-score"><span className="muted">Views</span><br /><b>{compact(channel?.statistics?.viewCount)}</b><div className="status-pill">▲ Organic</div></div>
              <div className="mini-score"><span className="muted">Subscribers</span><br /><b>{compact(channel?.statistics?.subscriberCount)}</b><div className="status-pill">▲ Audience</div></div>
              <div className="mini-score"><span className="muted">Videos</span><br /><b>{fullNumber(channel?.statistics?.videoCount)}</b><div className="status-pill">Library</div></div>
              <div className="mini-score"><span className="muted">Content Focus</span><br /><b>Roblox</b><div className="status-pill">Shorts</div></div>
            </div>
            <p className="footer-note">Grafik detail bisa ditambahkan nanti dari YouTube Analytics API. Versi ini memakai YouTube Data API untuk channel/video.</p>
          </div>
          <div className="card">
            <h2>Top Videos</h2>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>#</th><th>Video</th><th>Views</th><th>Likes</th><th>Status</th></tr></thead>
                <tbody>{sortedVideos.slice(0, 5).map((v, i) => <VideoRow key={v.id} video={v} index={i} />)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid grid-3">
          <div className="card"><h3>Ide Konten Berikutnya</h3><p className="muted">Roblox update terbaru, limited/free item, avatar marketplace, event official, viral Roblox game.</p><button className="btn primary" onClick={() => setActive("roblox")}>Generate Ide</button></div>
          <div className="card"><h3>SEO Cepat</h3><p className="muted">Gunakan keyword utama di judul, 2 baris pertama deskripsi, hashtag, dan pinned comment.</p><button className="btn" onClick={() => setActive("optimizer")}>Optimize Video</button></div>
          <div className="card"><h3>Action Plan 7 Hari</h3><p className="muted">Hari 1 audit video lama, hari 2 riset keyword, hari 3 upload 1-2 Shorts, hari 4 promosi, hari 5 cek retention.</p></div>
        </section>
      </div>
    );
  }

  function renderOptimizer() {
    return (
      <div className="grid">
        <div className="card">
          <h2>Video Optimizer</h2>
          <p className="muted">Pilih video publish/terjadwal yang terbaca dari channel, lalu AI akan memberi saran caption, deskripsi, hashtag, keyword, CTA, pinned comment, dan thumbnail text.</p>
          {videosState.loading ? <div className="skeleton" /> : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>#</th><th>Video</th><th>Views</th><th>Likes</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>{videos.map((v, i) => <VideoRow key={v.id} video={v} index={i} onSelect={optimizeVideo} />)}</tbody>
              </table>
            </div>
          )}
        </div>

        {selectedVideo && (
          <div className="card">
            <h2>Hasil Optimasi: {selectedVideo?.snippet?.title}</h2>
            {optimizer.loading && <div className="skeleton" />}
            {optimizer.error && <div className="alert error">{optimizer.error}</div>}
            {optimizer.data && renderOptimizerResult(optimizer.data)}
          </div>
        )}
      </div>
    );
  }

  function renderOptimizerResult(result: any) {
    if (typeof result === "string") return <div className="output">{result}</div>;
    const copyText = JSON.stringify(result, null, 2);
    return (
      <div className="grid">
        <div className="copy-row"><h3>Rekomendasi AI</h3><CopyButton text={copyText} label="Copy Semua" /></div>
        <div className="grid grid-4">
          {result.score && Object.entries(result.score).map(([k, v]: any) => <div className="mini-score" key={k}><span className="muted">{k}</span><br /><b>{v}</b></div>)}
        </div>
        {result.diagnosis && <div className="output">{result.diagnosis}</div>}
        <div className="grid grid-2">
          <OutputBlock title="Judul Alternatif" value={(result.recommendedTitles || []).join("\n")} />
          <OutputBlock title="Thumbnail Text" value={(result.thumbnailTexts || []).join("\n")} />
          <OutputBlock title="Caption" value={result.caption} />
          <OutputBlock title="Description" value={result.description} />
          <OutputBlock title="Hashtags" value={(result.hashtags || []).join(" ")} />
          <OutputBlock title="Keywords" value={(result.keywords || []).join(", ")} />
          <OutputBlock title="Pinned Comment" value={result.pinnedComment} />
          <OutputBlock title="CTA" value={result.cta} />
        </div>
        <OutputBlock title="Action Plan" value={(result.actionPlan || []).map((x: string, i: number) => `${i + 1}. ${x}`).join("\n")} />
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
    const topicList = topics.data?.topics || [];
    return (
      <div className="grid">
        <div className="card">
          <h2>Roblox Shorts Creator</h2>
          <p className="muted">Workflow: search berita/update Roblox → pilih 1 topik → generate 5 scene Shorts 45-60 detik lengkap dengan hook kuat, VO natural, 2 prompt gambar per scene, arahan gameplay, caption, deskripsi, hashtag, dan CTA ending kuat.</p>
          <div className="form-row">
            <input className="input" value={robloxQuery} onChange={(e) => setRobloxQuery(e.target.value)} placeholder="Roblox update, Roblox event, free limited item..." />
            <select className="select" value={robloxLanguage} onChange={(e) => setRobloxLanguage(e.target.value)}>
              <option>English</option>
              <option>Indonesia</option>
            </select>
            <select className="select" value={robloxDuration} onChange={(e) => setRobloxDuration(e.target.value)}>
              <option>45 seconds</option>
              <option>60 seconds</option>
            </select>
            <select className="select" value={robloxStyle} onChange={(e) => setRobloxStyle(e.target.value)}>
              <option>Natural News</option>
              <option>Excited Gaming</option>
              <option>Mystery</option>
              <option>Fun Facts</option>
            </select>
            <button className="btn primary" onClick={searchRobloxTopics}>Search Update</button>
          </div>
        </div>

        <div className="alert">
          Wajib: Scene 1 harus langsung kuat di 0-3 detik agar penonton tidak scroll. Scene 5 harus memakai pertanyaan + komentar + like + subscribe/follow agar engagement naik.
        </div>

        {topics.loading && <div className="skeleton" />}
        {topics.error && <div className="alert error">{topics.error}</div>}
        {!!topicList.length && (
          <div className="option-grid">
            {topicList.map((t: any, index: number) => (
              <div className="topic-card" key={t.id || index}>
                <div className="copy-row">
                  <h3>{t.title}</h3>
                  <span className="status-pill">{t.viralScore || "-"}/100</span>
                </div>
                <p className="muted small">{t.summary}</p>
                <div className="kv"><b>Kenapa ramai</b><span>{t.whyTrending}</span></div>
                <div className="kv"><b>Potensi views</b><span>{t.potentialViews}</span></div>
                <div className="kv"><b>Cocok Shorts</b><span>{t.shortsFit}</span></div>
                <div className="kv"><b>Gameplay cocok</b><span>{t.gameplayDirection}</span></div>
                <button className="btn primary" onClick={() => generateRobloxScript(t)}>Pilih & Generate Script</button>
              </div>
            ))}
          </div>
        )}

        {script.loading && <div className="skeleton" />}
        {script.error && <div className="alert error">{script.error}</div>}
        {script.data && renderScriptResult(script.data)}
      </div>
    );
  }

  function renderScriptResult(result: any) {
    if (typeof result === "string") return <div className="card"><div className="output">{result}</div></div>;
    const fullText = JSON.stringify(result, null, 2);
    const sceneText = (result.scenes || []).map((s: any) => `Scene ${s.scene} - ${s.name}\nDurasi: ${s.duration}\nOverlay: ${s.overlayText}\nVO: ${s.vo}\nGameplay: ${s.gameplayDirection}\nEditing: ${s.editingDirection}\nSFX: ${s.sfx}\nPrompt 1: ${s.imagePrompts?.[0]}\nPrompt 2: ${s.imagePrompts?.[1]}`).join("\n\n");
    return (
      <div className="card">
        <div className="copy-row">
          <div>
            <h2>{result.videoTitle || "Roblox Shorts Script"}</h2>
            <p className="muted small">Topik dipilih: {selectedTopic?.title}</p>
          </div>
          <CopyButton text={fullText} label="Copy Semua JSON" />
        </div>
        {result.topicScore && (
          <div className="grid grid-4" style={{ marginBottom: 16 }}>
            <div className="mini-score"><span className="muted">Total Score</span><br /><b>{result.topicScore.totalOutOf50}/50</b><div className="status-pill">{result.topicScore.category}</div></div>
            <div className="mini-score"><span className="muted">Trend</span><br /><b>{result.topicScore.trendRelevance}</b></div>
            <div className="mini-score"><span className="muted">Visual</span><br /><b>{result.topicScore.visualizability}</b></div>
            <div className="mini-score"><span className="muted">Engagement</span><br /><b>{result.topicScore.engagementPotential}</b></div>
          </div>
        )}
        <div className="tabs">
          {[
            ["scenes", "Scene Script"],
            ["vo", "Full VO"],
            ["gameplay", "Gameplay Direction"],
            ["prompts", "Image Prompts"],
            ["metadata", "Caption & SEO"],
            ["checklist", "Checklist"]
          ].map(([id, label]) => <button key={id} className={scriptTab === id ? "active" : ""} onClick={() => setScriptTab(id)}>{label}</button>)}
        </div>

        {scriptTab === "scenes" && (
          <div>
            <div className="copy-row"><h3>Scene 1-5</h3><CopyButton text={sceneText} /></div>
            {(result.scenes || []).map((scene: any) => (
              <div className="scene" key={scene.scene}>
                <div className="scene-head"><h3>Scene {scene.scene}: {scene.name}</h3><span className="status-pill">{scene.duration}</span></div>
                <div className="kv"><b>Goal</b><span>{scene.goal}</span></div>
                <div className="kv"><b>Overlay</b><span>{scene.overlayText}</span></div>
                <div className="kv"><b>VO</b><span>{scene.vo}</span></div>
                <div className="kv"><b>Gameplay</b><span>{scene.gameplayDirection}</span></div>
                <div className="kv"><b>Editing</b><span>{scene.editingDirection}</span></div>
                <div className="kv"><b>SFX</b><span>{scene.sfx}</span></div>
                <OutputBlock title="Prompt Gambar 1" value={scene.imagePrompts?.[0]} compactBlock />
                <OutputBlock title="Prompt Gambar 2" value={scene.imagePrompts?.[1]} compactBlock />
              </div>
            ))}
          </div>
        )}

        {scriptTab === "vo" && <OutputBlock title="Full VO Copy Ready" value={result.fullVO} />}
        {scriptTab === "gameplay" && (
          <div className="grid">
            <OutputBlock title="Main Gameplay Type" value={result.gameplayPlan?.mainGameplayType} />
            <OutputBlock title="Recommended Roblox Games / Maps" value={(result.gameplayPlan?.recommendedRobloxGamesOrMaps || []).join("\n")} />
            <OutputBlock title="Clips To Record" value={(result.gameplayPlan?.clipsToRecord || []).join("\n")} />
            <OutputBlock title="Recording Tips" value={(result.gameplayPlan?.recordingTips || []).join("\n")} />
          </div>
        )}
        {scriptTab === "prompts" && <OutputBlock title="All Image Prompts" value={(result.scenes || []).flatMap((s: any) => s.imagePrompts || []).map((p: string, i: number) => `${i + 1}. ${p}`).join("\n\n")} />}
        {scriptTab === "metadata" && (
          <div className="grid grid-2">
            <OutputBlock title="Caption" value={result.caption} />
            <OutputBlock title="Description" value={result.description} />
            <OutputBlock title="Hashtags" value={(result.hashtags || []).join(" ")} />
            <OutputBlock title="Pinned Comment" value={result.pinnedComment} />
            <OutputBlock title="Thumbnail Text" value={(result.thumbnailTexts || []).join("\n")} />
          </div>
        )}
        {scriptTab === "checklist" && (
          <div className="grid grid-2">
            <OutputBlock title="Asset Checklist" value={(result.assetChecklist || []).join("\n")} />
            <OutputBlock title="Final Quality Checklist" value={(result.finalQualityChecklist || []).join("\n")} />
          </div>
        )}
      </div>
    );
  }

  function renderReports() {
    const report = `Creator Insight Report\n\nChannel: ${channel?.snippet?.title || "-"}\nSubscribers: ${fullNumber(channel?.statistics?.subscriberCount)}\nTotal Views: ${fullNumber(channel?.statistics?.viewCount)}\nTotal Videos: ${fullNumber(channel?.statistics?.videoCount)}\n\nAction Plan:\n1. Optimasi 3 video lama dengan SEO title dan description.\n2. Riset topik Roblox terbaru.\n3. Buat 1-2 Shorts per hari dengan hook 3 detik kuat.\n4. Gunakan CTA ending: pertanyaan + komen + like + subscribe/follow.\n5. Cek video dengan retention paling tinggi dan ulangi polanya.`;
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
    <div style={{ marginTop: compactBlock ? 10 : 0 }}>
      <div className="copy-row">
        <h3>{title}</h3>
        <CopyButton text={text} />
      </div>
      <div className="output">{text}</div>
    </div>
  );
}
