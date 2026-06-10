const fs = require("fs");

const target = "app/components/CreatorInsightApp.tsx";
const originalBackup = "app/components/CreatorInsightApp.tsx.BEFORE_PATCH";

if (!fs.existsSync(originalBackup)) {
  throw new Error("Backup original tidak ditemukan: " + originalBackup);
}

fs.copyFileSync(originalBackup, target);
console.log("Restored original UI from:", originalBackup);

let s = fs.readFileSync(target, "utf8");

function replaceOne(search, replacement, label) {
  if (!s.includes(search)) {
    console.warn("Tidak ketemu:", label);
    return;
  }
  s = s.replace(search, replacement);
  console.log("Patched:", label);
}

// 1. Pakai API video yang sudah terbukti jalan
replaceOne(
  `fetchJson("/api/youtube/videos?maxResults=15")`,
  `fetchJson("/api/youtube/channel-videos")`,
  "dashboard video API"
);

// 2. Mapping channel response baru
replaceOne(
  `setChannelState({ loading: false, error: "", data: channelRes.channel });`,
  `setChannelState({ loading: false, error: "", data: channelRes.channel || channelRes });`,
  "channel mapping"
);

// 3. Mapping video response baru
replaceOne(
  `setVideosState({ loading: false, error: "", data: videosRes.videos || [] });`,
  `setVideosState({ loading: false, error: "", data: Array.isArray(videosRes) ? videosRes : videosRes.videos || [] });`,
  "videos mapping"
);

// 4. Thumbnail video
replaceOne(
  `const thumb = video?.snippet?.thumbnails?.medium?.url || video?.snippet?.thumbnails?.default?.url;`,
  `const thumb = video?.thumbnail || video?.snippet?.thumbnails?.high?.url || video?.snippet?.thumbnails?.medium?.url || video?.snippet?.thumbnails?.default?.url;`,
  "video thumbnail"
);

// 5. Status video: Published hijau, Scheduled oren, lainnya abu
s = s.replace(
  /const privacy = .*?;\r?\n  return \(/,
  `const rawStatus = video?.status?.privacyStatus || video?.privacyStatus || video?.status || "Published";
  const statusKey = String(rawStatus).toLowerCase();

  const statusLabel =
    statusKey === "public" || statusKey === "published"
      ? "Published"
      : statusKey === "scheduled"
      ? "Scheduled"
      : statusKey === "private"
      ? "Private"
      : statusKey === "unlisted"
      ? "Unlisted"
      : String(rawStatus);

  const statusStyle: any =
    statusKey === "public" || statusKey === "published"
      ? {
          background: "rgba(34,197,94,0.16)",
          borderColor: "rgba(34,197,94,0.45)",
          color: "#22c55e",
        }
      : statusKey === "scheduled"
      ? {
          background: "rgba(245,158,11,0.18)",
          borderColor: "rgba(245,158,11,0.45)",
          color: "#f59e0b",
        }
      : {
          background: "rgba(148,163,184,0.14)",
          borderColor: "rgba(148,163,184,0.35)",
          color: "#cbd5e1",
        };

  return (`
);
console.log("Patched: video status logic");

// 6. Judul video
replaceOne(
  `<strong>{video?.snippet?.title || "Untitled"}</strong>`,
  `<strong>{video?.title || video?.snippet?.title || "Untitled"}</strong>`,
  "video title"
);

// 7. Tanggal video
replaceOne(
  `<div className="muted small">{dateText(video?.snippet?.publishedAt)}</div>`,
  `<div className="muted small">{dateText(video?.publishedAt || video?.publishAt || video?.snippet?.publishedAt)}</div>`,
  "video date"
);

// 8. Views dan likes
replaceOne(
  `<td>{compact(video?.statistics?.viewCount)}</td>`,
  `<td>{compact(video?.views ?? video?.statistics?.viewCount)}</td>`,
  "video views"
);

replaceOne(
  `<td>{compact(video?.statistics?.likeCount)}</td>`,
  `<td>{compact(video?.likes ?? video?.statistics?.likeCount)}</td>`,
  "video likes"
);

// 9. Status span
replaceOne(
  `<td><span className={privacy === "public" ? "status-pill" : "status-pill yellow"}>{privacy}</span></td>`,
  `<td><span className="status-pill" style={statusStyle}>{statusLabel}</span></td>`,
  "video status UI"
);

// 10. Channel avatar dan info
replaceOne(
  `const avatar = channel?.snippet?.thumbnails?.high?.url || channel?.snippet?.thumbnails?.medium?.url;`,
  `const avatar = channel?.thumbnail || channel?.snippet?.thumbnails?.high?.url || channel?.snippet?.thumbnails?.medium?.url || channel?.snippet?.thumbnails?.default?.url;`,
  "channel avatar"
);

replaceOne(
  `<h1>{channel?.snippet?.title || "Your YouTube Channel"}</h1>`,
  `<h1>{channel?.title || channel?.snippet?.title || "Your YouTube Channel"}</h1>`,
  "channel title"
);

replaceOne(
  `<p>{channel?.snippet?.customUrl || channel?.id || "Login berhasil. Data channel akan tampil di sini."}</p>`,
  `<p>{channel?.description || channel?.snippet?.customUrl || channel?.id || "Login berhasil. Data channel akan tampil di sini."}</p>`,
  "channel subtitle"
);

replaceOne(
  `<div className="stat"><b>{compact(channel?.statistics?.subscriberCount)}</b><span>Subscribers</span></div>`,
  `<div className="stat"><b>{compact(channel?.subscribers ?? channel?.statistics?.subscriberCount)}</b><span>Subscribers</span></div>`,
  "subscriber stat"
);

replaceOne(
  `<div className="stat"><b>{compact(channel?.statistics?.viewCount)}</b><span>Total Views</span></div>`,
  `<div className="stat"><b>{compact(channel?.totalViews ?? channel?.statistics?.viewCount)}</b><span>Total Views</span></div>`,
  "views stat"
);

replaceOne(
  `<div className="stat"><b>{compact(channel?.statistics?.videoCount)}</b><span>Total Videos</span></div>`,
  `<div className="stat"><b>{compact(channel?.totalVideos ?? channel?.statistics?.videoCount)}</b><span>Total Videos</span></div>`,
  "videos stat"
);

replaceOne(
  `<div className="stat"><b>{dateText(channel?.snippet?.publishedAt)}</b><span>Joined</span></div>`,
  `<div className="stat"><b>{dateText(channel?.publishedAt ?? channel?.snippet?.publishedAt)}</b><span>Joined</span></div>`,
  "joined stat"
);

fs.writeFileSync(target, s, "utf8");

console.log("Selesai. Original UI dikembalikan + data mapping diperbaiki.");