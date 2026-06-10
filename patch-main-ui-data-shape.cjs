const fs = require("fs");

const file = "app/components/CreatorInsightApp.tsx";

function backup(filePath) {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const backupPath = filePath + ".BEFORE_DATA_SHAPE_FIX_" + stamp;
  fs.copyFileSync(filePath, backupPath);
  console.log("Backup:", backupPath);
}

function replaceFunction(source, functionName, replacement) {
  const start = source.indexOf(`function ${functionName}`);
  if (start === -1) {
    throw new Error(`Function ${functionName} tidak ditemukan`);
  }

  const braceStart = source.indexOf("{", start);
  if (braceStart === -1) {
    throw new Error(`Opening brace ${functionName} tidak ditemukan`);
  }

  let depth = 0;
  let end = -1;

  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];

    if (ch === "{") depth++;
    if (ch === "}") depth--;

    if (depth === 0) {
      end = i + 1;
      break;
    }
  }

  if (end === -1) {
    throw new Error(`Closing brace ${functionName} tidak ditemukan`);
  }

  return source.slice(0, start) + replacement.trimEnd() + source.slice(end);
}

function replaceOrWarn(source, search, replacement, label) {
  if (!source.includes(search)) {
    console.warn("Tidak ketemu:", label);
    return source;
  }

  return source.replace(search, replacement);
}

backup(file);

let s = fs.readFileSync(file, "utf8");

s = replaceFunction(
  s,
  "VideoRow",
  `
function VideoRow({ video, index, onSelect }: { video: any; index: number; onSelect?: (video: any) => void }) {
  const thumb =
    video?.thumbnail ||
    video?.snippet?.thumbnails?.medium?.url ||
    video?.snippet?.thumbnails?.default?.url ||
    "";

  const title =
    video?.title ||
    video?.snippet?.title ||
    "Untitled";

  const publishedAt =
    video?.publishedAt ||
    video?.publishAt ||
    video?.snippet?.publishedAt ||
    "";

  const views =
    video?.views ??
    video?.statistics?.viewCount ??
    0;

  const likes =
    video?.likes ??
    video?.statistics?.likeCount ??
    0;

  const statusText =
    video?.status ||
    video?.privacyStatus ||
    video?.status?.privacyStatus ||
    "Published";

  const normalizedStatus = String(statusText).toLowerCase();

  return (
    <tr>
      <td>{index + 1}</td>
      <td>
        <div className="video-cell">
          {thumb && <img src={thumb} className="thumb" alt="thumbnail" />}
          <div>
            <strong>{title}</strong>
            <div className="muted small">{dateText(publishedAt)}</div>
          </div>
        </div>
      </td>
      <td>{compact(views)}</td>
      <td>{compact(likes)}</td>
      <td>
        <span className={normalizedStatus === "published" || normalizedStatus === "public" ? "status-pill" : "status-pill yellow"}>
          {statusText}
        </span>
      </td>
      {onSelect && <td><button className="btn" onClick={() => onSelect(video)}>Optimize</button></td>}
    </tr>
  );
}
`
);

s = replaceFunction(
  s,
  "loadDashboard",
  `
async function loadDashboard() {
    setChannelState({ loading: true, error: "", data: null });
    setVideosState({ loading: true, error: "", data: [] });

    try {
      const [channelRes, videosRes] = await Promise.all([
        fetchJson("/api/youtube/channel"),
        fetchJson("/api/youtube/channel-videos")
      ]);

      const normalizedChannel = channelRes?.channel || channelRes || null;
      const normalizedVideos = Array.isArray(videosRes)
        ? videosRes
        : Array.isArray(videosRes?.videos)
        ? videosRes.videos
        : [];

      setChannelState({ loading: false, error: "", data: normalizedChannel });
      setVideosState({ loading: false, error: "", data: normalizedVideos });
    } catch (err: any) {
      setChannelState({ loading: false, error: err.message, data: null });
      setVideosState({ loading: false, error: err.message, data: [] });
    }
  }
`
);

s = s.replace(
  /const sortedVideos = useMemo\(\(\) => \[\.\.\.videos\]\.sort\(\(a, b\) => Number\(b\?\.statistics\?\.viewCount \|\| 0\) - Number\(a\?\.statistics\?\.viewCount \|\| 0\)\), \[videos\]\);/,
  `const sortedVideos = useMemo(() => [...videos].sort((a, b) => Number(b?.views ?? b?.statistics?.viewCount ?? 0) - Number(a?.views ?? a?.statistics?.viewCount ?? 0)), [videos]);`
);

s = s.replace(
  /const channelScore = useMemo\(\(\) => \{[\s\S]*?return raw;\s*\}, \[channel\]\);/,
  `const channelScore = useMemo(() => {
    const views = Number(channel?.totalViews ?? channel?.statistics?.viewCount ?? 0);
    const subs = Number(channel?.subscribers ?? channel?.statistics?.subscriberCount ?? 0);
    const count = Number(channel?.totalVideos ?? channel?.statistics?.videoCount ?? 0);
    const avg = count ? views / count : 0;
    const raw = Math.min(92, Math.max(45, Math.round(55 + Math.log10(Math.max(avg, 10)) * 7 + Math.log10(Math.max(subs, 10)) * 3)));
    return raw;
  }, [channel]);`
);

s = replaceOrWarn(
  s,
  `const avatar = channel?.snippet?.thumbnails?.high?.url || channel?.snippet?.thumbnails?.medium?.url;`,
  `const avatar =
      channel?.thumbnail ||
      channel?.snippet?.thumbnails?.high?.url ||
      channel?.snippet?.thumbnails?.medium?.url ||
      channel?.snippet?.thumbnails?.default?.url;`,
  "channel avatar"
);

s = replaceOrWarn(
  s,
  `<h1>{channel?.snippet?.title || "Your YouTube Channel"}</h1>`,
  `<h1>{channel?.title || channel?.snippet?.title || "Your YouTube Channel"}</h1>`,
  "channel title"
);

s = replaceOrWarn(
  s,
  `<p>{channel?.snippet?.customUrl || channel?.id || "Login berhasil. Data channel akan tampil di sini."}</p>`,
  `<p>{channel?.description || channel?.snippet?.customUrl || channel?.id || "Login berhasil. Data channel akan tampil di sini."}</p>`,
  "channel description"
);

s = replaceOrWarn(
  s,
  `<div className="stat"><b>{compact(channel?.statistics?.subscriberCount)}</b><span>Subscribers</span></div>`,
  `<div className="stat"><b>{compact(channel?.subscribers ?? channel?.statistics?.subscriberCount)}</b><span>Subscribers</span></div>`,
  "subscribers stat"
);

s = replaceOrWarn(
  s,
  `<div className="stat"><b>{compact(channel?.statistics?.viewCount)}</b><span>Total Views</span></div>`,
  `<div className="stat"><b>{compact(channel?.totalViews ?? channel?.statistics?.viewCount)}</b><span>Total Views</span></div>`,
  "views stat"
);

s = replaceOrWarn(
  s,
  `<div className="stat"><b>{compact(channel?.statistics?.videoCount)}</b><span>Total Videos</span></div>`,
  `<div className="stat"><b>{compact(channel?.totalVideos ?? channel?.statistics?.videoCount)}</b><span>Total Videos</span></div>`,
  "videos stat"
);

s = replaceOrWarn(
  s,
  `<div className="stat"><b>{dateText(channel?.snippet?.publishedAt)}</b><span>Joined</span></div>`,
  `<div className="stat"><b>{dateText(channel?.publishedAt ?? channel?.snippet?.publishedAt)}</b><span>Joined</span></div>`,
  "joined stat"
);

s = replaceOrWarn(
  s,
  `<div className="mini-score"><span className="muted">Views</span><br /><b>{compact(channel?.statistics?.viewCount)}</b><div className="status-pill">▲ Organic</div></div>`,
  `<div className="mini-score"><span className="muted">Views</span><br /><b>{compact(channel?.totalViews ?? channel?.statistics?.viewCount)}</b><div className="status-pill">▲ Organic</div></div>`,
  "overview views"
);

s = replaceOrWarn(
  s,
  `<div className="mini-score"><span className="muted">Subscribers</span><br /><b>{compact(channel?.statistics?.subscriberCount)}</b><div className="status-pill">▲ Audience</div></div>`,
  `<div className="mini-score"><span className="muted">Subscribers</span><br /><b>{compact(channel?.subscribers ?? channel?.statistics?.subscriberCount)}</b><div className="status-pill">▲ Audience</div></div>`,
  "overview subscribers"
);

s = replaceOrWarn(
  s,
  `<div className="mini-score"><span className="muted">Videos</span><br /><b>{fullNumber(channel?.statistics?.videoCount)}</b><div className="status-pill">Library</div></div>`,
  `<div className="mini-score"><span className="muted">Videos</span><br /><b>{fullNumber(channel?.totalVideos ?? channel?.statistics?.videoCount)}</b><div className="status-pill">Library</div></div>`,
  "overview videos"
);

s = replaceOrWarn(
  s,
  `<h2>Hasil Optimasi: {selectedVideo?.snippet?.title}</h2>`,
  `<h2>Hasil Optimasi: {selectedVideo?.title || selectedVideo?.snippet?.title}</h2>`,
  "selected video title"
);

s = s.replace(
  /Channel: \$\{channel\?\.snippet\?\.title \|\| "-"\}\\nSubscribers:\s*\$\{fullNumber\(channel\?\.statistics\?\.subscriberCount\)\}\\nTotal Views:\s*\$\{fullNumber\(channel\?\.statistics\?\.viewCount\)\}\\nTotal Videos:\s*\$\{fullNumber\(channel\?\.statistics\?\.videoCount\)\}/,
  `Channel: \${channel?.title || channel?.snippet?.title || "-"}\\nSubscribers: \${fullNumber(channel?.subscribers ?? channel?.statistics?.subscriberCount)}\\nTotal Views: \${fullNumber(channel?.totalViews ?? channel?.statistics?.viewCount)}\\nTotal Videos: \${fullNumber(channel?.totalVideos ?? channel?.statistics?.videoCount)}`
);

fs.writeFileSync(file, s, "utf8");

console.log("Selesai patch CreatorInsightApp data shape.");
console.log("Sekarang jalankan: npm run build");