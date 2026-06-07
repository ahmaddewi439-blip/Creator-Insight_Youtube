const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const STOPWORDS = new Set([
  "the", "and", "for", "you", "your", "with", "from", "this", "that",
  "are", "was", "were", "will", "how", "why", "what", "when", "where",
  "video", "youtube", "shorts", "short", "official", "full", "new",
  "yang", "dan", "untuk", "dengan", "ini", "itu", "dari", "cara",
  "bisa", "akan", "atau", "pada", "dalam", "jadi", "lebih", "kamu",
  "saya", "kami", "mereka", "adalah", "tidak", "sudah", "belum",
  "https", "http", "www", "com", "net", "org", "subscribe", "like",
  "comment", "share", "follow", "channel"
]);

function toNumber(value) {
  return Number(value || 0);
}

function getBestThumbnail(thumbnails) {
  if (!thumbnails) return "";

  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    ""
  );
}

function extractVideoId(input) {
  const raw = String(input || "").trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return raw;
  }

  const watchMatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  const shortMatch = raw.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  const youtuMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtuMatch) return youtuMatch[1];

  const embedMatch = raw.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

function extractHashtags(text) {
  const matches = String(text || "").match(/#[\p{L}\p{N}_]+/gu) || [];

  return [...new Set(matches)]
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function cleanWord(word) {
  return String(word || "")
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g, "")
    .trim();
}

function extractKeywords(title, description, tags) {
  const text = [
    title || "",
    title || "",
    description || "",
    ...(tags || []),
  ].join(" ");

  const words = text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/www\.\S+/g, " ")
    .split(/\s+/)
    .map(cleanWord)
    .filter((word) => {
      if (!word) return false;
      if (word.length < 3) return false;
      if (STOPWORDS.has(word)) return false;
      if (/^\d+$/.test(word)) return false;
      if (/^(19|20)\d{2}$/.test(word)) return false;
      return true;
    });

  const map = new Map();

  words.forEach((word) => {
    map.set(word, (map.get(word) || 0) + 1);
  });

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword)
    .slice(0, 15);
}

function calculateLaunchScore(video) {
  let score = 35;

  const titleLength = video.title.length;
  const descriptionLength = video.description.length;
  const hashtagsCount = video.hashtags.length;
  const tagsCount = video.tags.length;

  if (titleLength >= 35 && titleLength <= 75) score += 18;
  else if (titleLength >= 20 && titleLength <= 95) score += 10;

  if (descriptionLength >= 250) score += 18;
  else if (descriptionLength >= 120) score += 10;

  if (hashtagsCount >= 3 && hashtagsCount <= 8) score += 12;
  else if (hashtagsCount > 0) score += 6;

  if (tagsCount >= 5) score += 10;
  else if (tagsCount > 0) score += 5;

  if (/\d/.test(video.title)) score += 5;
  if (/[?!]/.test(video.title)) score += 4;

  if (video.thumbnail) score += 3;

  return Math.min(Math.max(score, 0), 100);
}

function buildNotes(video, launchScore) {
  const notes = [];

  if (launchScore >= 80) {
    notes.push("Metadata video sudah cukup kuat untuk tahap awal publish.");
  } else if (launchScore >= 60) {
    notes.push("Video sudah cukup siap, tetapi judul/deskripsi/hashtag masih bisa diperkuat.");
  } else {
    notes.push("Metadata video masih lemah. Perlu optimasi judul, deskripsi, hashtag, dan keyword.");
  }

  if (video.title.length < 35) {
    notes.push("Judul masih cukup pendek. Coba tambahkan angle rasa penasaran atau hasil yang jelas.");
  }

  if (video.description.length < 120) {
    notes.push("Deskripsi masih pendek. Tambahkan ringkasan isi video, keyword utama, CTA, dan hashtag relevan.");
  }

  if (video.hashtags.length === 0) {
    notes.push("Belum ada hashtag terdeteksi. Tambahkan 3–8 hashtag yang relevan dengan topik video.");
  }

  if (video.tags.length === 0) {
    notes.push("Tag tidak terdeteksi dari data publik. Jika ini video milik sendiri, pastikan tag relevan sudah diisi di YouTube Studio.");
  }

  notes.push("Tahap berikutnya V4.3 akan membuat deskripsi, hashtag, judul alternatif, pinned comment, dan CTA dengan AI.");

  return notes;
}

async function youtubeRequest(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);

  Object.entries({
    ...params,
    key: YOUTUBE_API_KEY,
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Gagal mengambil data dari YouTube API.");
  }

  return data;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        message: "Method tidak diizinkan.",
      });
    }

    if (!YOUTUBE_API_KEY) {
      return res.status(500).json({
        message: "YOUTUBE_API_KEY belum diisi di Environment Variables Vercel.",
      });
    }

    const { videoUrl } = req.body || {};

    if (!videoUrl) {
      return res.status(400).json({
        message: "Masukkan link video YouTube.",
      });
    }

    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
      return res.status(400).json({
        message: "Link video tidak valid. Gunakan link watch, shorts, youtu.be, atau Video ID.",
      });
    }

    const data = await youtubeRequest("videos", {
      part: "snippet,statistics,contentDetails,status",
      id: videoId,
    });

    const item = data.items?.[0];

    if (!item) {
      return res.status(404).json({
        message: "Video tidak ditemukan atau video tidak public.",
      });
    }

    const snippet = item.snippet || {};
    const statistics = item.statistics || {};
    const status = item.status || {};

    const hashtags = [
      ...extractHashtags(snippet.title),
      ...extractHashtags(snippet.description),
    ];

    const uniqueHashtags = [...new Set(hashtags)].slice(0, 20);

    const video = {
      id: item.id,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      title: snippet.title || "",
      description: snippet.description || "",
      channelId: snippet.channelId || "",
      channelTitle: snippet.channelTitle || "",
      publishedAt: snippet.publishedAt || "",
      thumbnail: getBestThumbnail(snippet.thumbnails),
      tags: snippet.tags || [],
      hashtags: uniqueHashtags,
      privacyStatus: status.privacyStatus || "public",
      viewCount: toNumber(statistics.viewCount),
      likeCount: toNumber(statistics.likeCount),
      commentCount: toNumber(statistics.commentCount),
    };

    const keywords = extractKeywords(video.title, video.description, video.tags);
    const launchScore = calculateLaunchScore(video);
    const notes = buildNotes(video, launchScore);

    return res.status(200).json({
      video,
      hashtags: uniqueHashtags,
      keywords,
      launchScore,
      notes,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Terjadi kesalahan server.",
    });
  }
};
