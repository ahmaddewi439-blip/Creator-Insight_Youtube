const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const STOPWORDS = new Set([
  "the", "and", "for", "you", "your", "with", "from", "this", "that", "are",
  "was", "were", "will", "how", "why", "what", "when", "where", "into",
  "video", "shorts", "short", "youtube", "official", "full", "new",
  "yang", "dan", "untuk", "dengan", "ini", "itu", "dari", "cara", "bisa",
  "akan", "atau", "pada", "dalam", "jadi", "lebih", "kamu", "saya"
]);

function n(value) {
  return Number(value || 0);
}

function avg(items) {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => sum + Number(item || 0), 0) / items.length;
}

function median(numbers) {
  if (!numbers || numbers.length === 0) return 0;

  const arr = numbers.map(Number).sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);

  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function daysSince(dateString) {
  if (!dateString) return 0;

  const diff = Date.now() - new Date(dateString).getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
}

function getThumb(thumbnails) {
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

function parseDurationToSeconds(duration) {
  if (!duration) return 0;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) return 0;

  return n(match[1]) * 3600 + n(match[2]) * 60 + n(match[3]);
}

function extractInput(input) {
  const raw = String(input || "").trim();

  const channelIdMatch = raw.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (channelIdMatch) {
    return { type: "id", value: channelIdMatch[1] };
  }

  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(raw)) {
    return { type: "id", value: raw };
  }

  const handleMatch = raw.match(/@([a-zA-Z0-9._-]+)/);
  if (handleMatch) {
    return { type: "handle", value: `@${handleMatch[1]}` };
  }

  if (raw.startsWith("@")) {
    return { type: "handle", value: raw };
  }

  const userMatch = raw.match(/\/user\/([^/?#]+)/);
  if (userMatch) {
    return { type: "username", value: userMatch[1] };
  }

  const customMatch = raw.match(/youtube\.com\/(?:c\/)?([^/?#]+)/);
  if (customMatch) {
    return { type: "search", value: customMatch[1] };
  }

  return { type: "search", value: raw };
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

async function getChannelById(id) {
  const data = await youtubeRequest("channels", {
    part: "snippet,statistics,contentDetails",
    id,
  });

  return data.items?.[0] || null;
}

async function resolveChannel(input) {
  const parsed = extractInput(input);

  if (parsed.type === "id") {
    const channel = await getChannelById(parsed.value);
    if (channel) return channel;
  }

  if (parsed.type === "handle") {
    const data = await youtubeRequest("channels", {
      part: "snippet,statistics,contentDetails",
      forHandle: parsed.value,
    });

    if (data.items?.[0]) return data.items[0];
  }

  if (parsed.type === "username") {
    const data = await youtubeRequest("channels", {
      part: "snippet,statistics,contentDetails",
      forUsername: parsed.value,
    });

    if (data.items?.[0]) return data.items[0];
  }

  const search = await youtubeRequest("search", {
    part: "snippet",
    q: parsed.value,
    type: "channel",
    maxResults: "1",
  });

  const foundId = search.items?.[0]?.snippet?.channelId;

  if (!foundId) {
    throw new Error("Channel tidak ditemukan. Coba pakai handle @channel atau link channel lengkap.");
  }

  const channel = await getChannelById(foundId);

  if (!channel) {
    throw new Error("Channel ditemukan, tetapi detail channel gagal dibaca.");
  }

  return channel;
}

async function getLatestVideoIds(uploadPlaylistId, limit) {
  const data = await youtubeRequest("playlistItems", {
    part: "snippet,contentDetails",
    playlistId: uploadPlaylistId,
    maxResults: String(Math.min(limit, 50)),
  });

  return (data.items || [])
    .map((item) => item.contentDetails?.videoId)
    .filter(Boolean);
}

async function getVideos(ids) {
  if (!ids || ids.length === 0) return [];

  const data = await youtubeRequest("videos", {
    part: "snippet,statistics,contentDetails",
    id: ids.join(","),
  });

  return (data.items || []).map((item) => {
    const snippet = item.snippet || {};
    const statistics = item.statistics || {};
    const contentDetails = item.contentDetails || {};

    const ageDays = daysSince(snippet.publishedAt);
    const viewCount = n(statistics.viewCount);
    const likeCount = n(statistics.likeCount);
    const commentCount = n(statistics.commentCount);
    const engagementRate = viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0;

    return {
      id: item.id,
      title: snippet.title || "Tanpa Judul",
      description: snippet.description || "",
      tags: snippet.tags || [],
      publishedAt: snippet.publishedAt,
      thumbnail: getThumb(snippet.thumbnails),
      viewCount,
      likeCount,
      commentCount,
      ageDays,
      viewsPerDay: Math.round(viewCount / ageDays),
      engagementRate: Number(engagementRate.toFixed(2)),
      durationSeconds: parseDurationToSeconds(contentDetails.duration),
    };
  });
}

function calculateUploadGap(videos) {
  if (!videos || videos.length < 2) return 0;

  const dates = videos
    .map((v) => new Date(v.publishedAt).getTime())
    .filter(Boolean)
    .sort((a, b) => b - a);

  const gaps = [];

  for (let i = 0; i < dates.length - 1; i++) {
    gaps.push(Math.abs(dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
  }

  return Number(avg(gaps).toFixed(1));
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s#@]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function keywordCounts(videos) {
  const map = new Map();

  videos.forEach((video) => {
    const words = [
      ...tokenize(video.title),
      ...tokenize(video.description).slice(0, 40),
      ...(video.tags || []).flatMap(tokenize),
    ];

    words.forEach((word) => {
      map.set(word, (map.get(word) || 0) + 1);
    });
  });

  return [...map.entries()]
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count);
}

function scoreTitle(title) {
  const text = String(title || "");
  let score = 35;

  const length = text.length;
  const words = text.split(/\s+/).filter(Boolean);

  if (length >= 35 && length <= 75) score += 20;
  else if (length >= 20 && length <= 95) score += 10;

  if (/\d/.test(text)) score += 12;
  if (/[?!]/.test(text)) score += 8;

  if (/(secret|mistake|ignored|until|before|after|why|how|best|worst|rare|viral|stuck|growth|hidden|tips|cara|kesalahan|rahasia|terbaik)/i.test(text)) {
    score += 15;
  }

  if (words.length >= 5 && words.length <= 12) score += 10;

  return clamp(score, 0, 100);
}

function scoreSeo(video) {
  let score = 30;

  const titleWords = tokenize(video.title);
  const descWords = tokenize(video.description);
  const tags = video.tags || [];

  if (titleWords.length >= 4) score += 15;
  if (video.description && video.description.length >= 150) score += 15;
  if (tags.length >= 3) score += 15;
  if (video.title.length >= 35 && video.title.length <= 75) score += 10;
  if (titleWords.some((word) => descWords.includes(word))) score += 10;
  if (video.thumbnail) score += 5;

  return clamp(score, 0, 100);
}

function enrichVideos(videos) {
  const avgViews = avg(videos.map((v) => v.viewCount));
  const medViews = median(videos.map((v) => v.viewCount)) || avgViews || 1;

  return videos.map((video) => {
    const performanceIndex = medViews > 0 ? video.viewCount / medViews : 0;
    const titleScore = scoreTitle(video.title);
    const seoScore = scoreSeo(video);

    let label = "Normal";
    let reason = "Performa berada di sekitar rata-rata channel.";

    if (performanceIndex >= 1.8) {
      label = "Winner";
      reason = `${performanceIndex.toFixed(1)}x lebih tinggi dari median channel. Pola ini layak diulang.`;
    } else if (performanceIndex <= 0.55) {
      label = "Weak";
      reason = "Performa jauh di bawah median channel. Perlu evaluasi hook, judul, dan thumbnail.";
    }

    return {
      ...video,
      performanceIndex: Number(performanceIndex.toFixed(2)),
      titleScore,
      seoScore,
      label,
      reason,
    };
  });
}

function buildScores(channel, videos) {
  const stats = channel.statistics || {};
  const subscriberCount = n(stats.subscriberCount);
  const hiddenSubscriberCount = Boolean(stats.hiddenSubscriberCount);

  const viewCounts = videos.map((v) => v.viewCount);
  const avgViews = avg(viewCounts);

  const half = Math.max(Math.floor(videos.length / 2), 1);
  const recentAvg = avg(videos.slice(0, half).map((v) => v.viewCount));
  const olderAvg = avg(videos.slice(half).map((v) => v.viewCount));
  const growthPercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

  const engagementRate = avg(videos.map((v) => v.engagementRate));
  const uploadGap = calculateUploadGap(videos);
  const seoAvg = Math.round(avg(videos.map((v) => v.seoScore)));
  const outlierCount = videos.filter((v) => v.label === "Winner").length;

  let growth = 55;
  if (growthPercentage >= 40) growth = 95;
  else if (growthPercentage >= 15) growth = 82;
  else if (growthPercentage >= -10) growth = 65;
  else if (growthPercentage >= -30) growth = 42;
  else growth = 25;

  let engagement = 35;
  if (engagementRate >= 6) engagement = 95;
  else if (engagementRate >= 3) engagement = 82;
  else if (engagementRate >= 1.5) engagement = 65;
  else if (engagementRate >= 0.5) engagement = 45;

  let consistency = 45;
  if (uploadGap > 0 && uploadGap <= 3) consistency = 92;
  else if (uploadGap <= 7) consistency = 78;
  else if (uploadGap <= 14) consistency = 58;
  else consistency = 35;

  let viral = 40;
  if (outlierCount >= 3) viral = 90;
  else if (outlierCount === 2) viral = 78;
  else if (outlierCount === 1) viral = 62;

  if (!hiddenSubscriberCount && subscriberCount > 0) {
    const viewToSub = (avgViews / subscriberCount) * 100;

    if (viewToSub >= 50) viral += 8;
    else if (viewToSub >= 20) viral += 5;
    else if (viewToSub < 3) viral -= 10;
  }

  viral = clamp(viral, 0, 100);

  const healthScore = Math.round(
    growth * 0.27 +
    engagement * 0.2 +
    consistency * 0.18 +
    seoAvg * 0.17 +
    viral * 0.18
  );

  let growthStatus = "Stabil";
  if (growthPercentage > 15) growthStatus = "Naik";
  if (growthPercentage < -15) growthStatus = "Turun";

  return {
    scores: {
      growth,
      engagement,
      consistency,
      seo: seoAvg,
      viral,
    },
    summary: {
      analyzedVideos: videos.length,
      averageViews: Math.round(avgViews),
      medianViews: Math.round(median(viewCounts)),
      recentAvg: Math.round(recentAvg),
      olderAvg: Math.round(olderAvg),
      growthPercentage: Number(growthPercentage.toFixed(2)),
      growthStatus,
      engagementRate: Number(engagementRate.toFixed(2)),
      avgUploadGapDays: uploadGap,
      outlierCount,
      healthScore,
    },
  };
}

function buildDiagnosis(summary, scores, channel, videos) {
  let title = "Channel Cukup Sehat";
  let text = "Channel memiliki fondasi yang cukup baik. Fokus berikutnya adalah memperbanyak format yang terbukti menang dan memperbaiki SEO judul/deskripsi.";

  if (!videos.length) {
    return {
      title: "Data Video Belum Cukup",
      text: "Channel belum memiliki video publik yang cukup untuk dianalisa.",
    };
  }

  if (summary.growthPercentage < -25) {
    title = "Growth Bottleneck";
    text = "Performa video terbaru turun cukup besar dibanding video sebelumnya. Biasanya penyebabnya adalah topik mulai melemah, hook kurang kuat, atau format konten tidak konsisten.";
  } else if (scores.seo < 50) {
    title = "SEO Channel Lemah";
    text = "Judul, deskripsi, atau keyword video belum cukup kuat. Perbaiki struktur judul, gunakan keyword yang konsisten, dan tambahkan deskripsi yang lebih informatif.";
  } else if (scores.engagement < 45) {
    title = "Engagement Rendah";
    text = "Penonton belum banyak memberi like atau komentar. Tambahkan pertanyaan, konflik ringan, atau CTA natural di akhir video.";
  } else if (scores.consistency < 50) {
    title = "Upload Tidak Konsisten";
    text = "Jarak upload terlalu jauh sehingga momentum channel melemah. Buat jadwal upload yang lebih tetap.";
  } else if (summary.outlierCount > 0) {
    title = "Ada Format Pemenang";
    text = "Channel memiliki video outlier yang performanya jauh di atas median. Ini sinyal kuat bahwa format/topik tersebut perlu dibuat seri lanjutan.";
  }

  return { title, text };
}

function keywordInsights(videos) {
  const all = keywordCounts(videos).slice(0, 15);

  const winners = videos.filter((v) => v.label === "Winner");
  const weak = videos.filter((v) => v.label === "Weak");

  return {
    main: all.slice(0, 10),
    winning: keywordCounts(winners).slice(0, 8),
    weak: keywordCounts(weak).slice(0, 8),
  };
}
function buildRecommendations(summary, scores, videos, keywords) {
  const best = videos.find((v) => v.label === "Winner") || videos[0];

  const recommendations = [];

  if (best) {
    recommendations.push(`Buat seri lanjutan dari video "${best.title}" karena performanya paling kuat dibanding video lain.`);
  }

  if (summary.growthPercentage < 0) {
    recommendations.push("Perbaiki hook 3 detik pertama, karena performa terbaru menunjukkan penurunan.");
  }

  if (scores.seo < 60) {
    recommendations.push("Naikkan SEO score dengan judul 35-75 karakter, keyword utama di awal judul, deskripsi minimal 150 karakter, dan tag relevan.");
  }

  if (scores.engagement < 60) {
    recommendations.push("Tambahkan engagement trigger: pertanyaan opini, pilihan A/B, atau komentar yang mudah dijawab penonton.");
  }

  if (scores.consistency < 65) {
    recommendations.push("Buat jadwal upload minimal 2-3 kali per minggu agar sinyal channel lebih stabil.");
  }

  const topKeyword = keywords.main?.[0]?.keyword;

  if (topKeyword) {
    recommendations.push(`Perkuat cluster keyword "${topKeyword}" karena paling sering muncul di channel ini.`);
  }

  recommendations.push("Gunakan thumbnail dengan satu fokus visual, kontras tinggi, dan teks pendek 2-4 kata.");
  recommendations.push("Setiap minggu audit 5 video terakhir: cari winner, weak video, dan format yang perlu diulang.");

  return recommendations;
}

function buildSeoSuggestions(summary, scores, keywords) {
  const list = [];

  const mainKeyword = keywords.main?.[0]?.keyword || "keyword utama";

  list.push(`Letakkan keyword "${mainKeyword}" di awal judul video berikutnya.`);
  list.push("Gunakan judul dengan struktur: masalah + rasa penasaran + hasil.");
  list.push("Tambahkan 2-3 kalimat deskripsi yang menjelaskan isi video dan mengulang keyword utama secara natural.");
  list.push("Tambahkan 5-8 tag relevan yang masih satu cluster dengan topik channel.");

  if (scores.seo < 60) {
    list.push("SEO score masih rendah. Prioritaskan perbaikan judul dan deskripsi pada video baru.");
  }

  if (summary.outlierCount > 0) {
    list.push("Gunakan keyword dari video outlier sebagai bahan topik seri berikutnya.");
  }

  return list;
}

function buildTitleFormulas(videos, keywords) {
  const keyword = keywords.main?.[0]?.keyword || "topik utama";

  return [
    `Kenapa ${keyword} Bisa Membuat Channel Kamu Naik?`,
    `5 Kesalahan ${keyword} yang Sering Diabaikan Creator`,
    `Saya Coba Strategi ${keyword} Selama 7 Hari, Hasilnya...`,
    `Jangan Upload Video ${keyword} Sebelum Tahu Hal Ini`,
    `Cara Membuat Konten ${keyword} yang Lebih Mudah Diklik`,
  ];
}

function buildActionPlan(summary, scores, videos) {
  const best = videos.find((v) => v.label === "Winner") || videos[0];

  return [
    `Hari 1: Audit video terbaik${best ? ` yaitu "${best.title}"` : ""}, catat topik, hook, judul, dan gaya thumbnail.`,
    "Hari 2: Buat 5 variasi judul baru dari topik terbaik, pilih yang paling spesifik dan bikin penasaran.",
    "Hari 3: Buat 2 konsep thumbnail dengan visual sederhana, fokus pada satu objek/emosi utama.",
    "Hari 4: Upload video baru dengan format yang mirip video terbaik, tapi angle berbeda.",
    "Hari 5: Balas komentar dan tambahkan CTA natural untuk meningkatkan engagement.",
    "Hari 6: Bandingkan performa 24 jam pertama dengan rata-rata channel.",
    "Hari 7: Buat keputusan: lanjutkan format pemenang, perbaiki format lemah, dan susun jadwal upload minggu berikutnya.",
  ];
}

function buildIdeas(videos, keywords) {
  const best = videos.find((v) => v.label === "Winner") || videos[0];
  const keyword = keywords.main?.[0]?.keyword || "channel YouTube";

  const ideas = [];

  if (best) {
    ideas.push(`Part 2 dari video: ${best.title}`);
    ideas.push(`Versi lebih singkat dari topik: ${best.title}`);
  }

  ideas.push(`5 fakta menarik tentang ${keyword} yang jarang dibahas.`);
  ideas.push(`Kesalahan umum dalam konten ${keyword} dan cara menghindarinya.`);
  ideas.push(`Eksperimen 7 hari membuat konten ${keyword}.`);
  ideas.push("Bedah video yang paling berhasil dan kenapa orang mau klik.");

  return ideas;
}

function buildAnalysis(channel, rawVideos) {
  const snippet = channel.snippet || {};
  const stats = channel.statistics || {};
  const videos = enrichVideos(rawVideos);

  const { scores, summary } = buildScores(channel, videos);
  const diagnosis = buildDiagnosis(summary, scores, channel, videos);

  const sortedByViews = [...videos].sort((a, b) => b.viewCount - a.viewCount);
  const best = sortedByViews[0] || null;
  const weakest = sortedByViews[sortedByViews.length - 1] || null;

  const keywords = keywordInsights(videos);

  const recommendations = buildRecommendations(summary, scores, videos, keywords);
  const seoSuggestions = buildSeoSuggestions(summary, scores, keywords);
  const titleFormulas = buildTitleFormulas(videos, keywords);
  const actionPlan = buildActionPlan(summary, scores, videos);
  const ideas = buildIdeas(videos, keywords);

  return {
    channel: {
      id: channel.id,
      title: snippet.title || "Channel YouTube",
      handle: snippet.customUrl || "",
      avatar: getThumb(snippet.thumbnails),
      publishedAt: snippet.publishedAt,
      subscriberCount: n(stats.subscriberCount),
      hiddenSubscriberCount: Boolean(stats.hiddenSubscriberCount),
      viewCount: n(stats.viewCount),
      videoCount: n(stats.videoCount),
    },
    scores,
    summary,
    diagnosis,
    videos: {
      items: videos,
      best,
      weakest,
      outliers: videos.filter((v) => v.label === "Winner"),
    },
    keywords,
    recommendations,
    seoSuggestions,
    titleFormulas,
    actionPlan,
    ideas,
  };
}

async function analyzeOneChannel(input, limit) {
  const channel = await resolveChannel(input);
  const uploadPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadPlaylistId) {
    throw new Error("Playlist upload channel tidak ditemukan.");
  }

  const ids = await getLatestVideoIds(uploadPlaylistId, limit);
  const videos = await getVideos(ids);

  return buildAnalysis(channel, videos);
}

function buildCompetitorInsight(main, competitor) {
  const mainAvg = main.summary.averageViews || 0;
  const compAvg = competitor.summary.averageViews || 0;

  if (compAvg > mainAvg * 1.5) {
    return "Kompetitor memiliki rata-rata views lebih tinggi. Pelajari pola judul, topik, dan frekuensi upload mereka.";
  }

  if (mainAvg > compAvg * 1.5) {
    return "Channel utama sudah unggul dari kompetitor ini dalam rata-rata views video terbaru.";
  }

  return "Performa cukup seimbang. Cari celah dari video outlier kompetitor untuk membuat angle yang lebih kuat.";
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method tidak diizinkan." });
    }

    if (!YOUTUBE_API_KEY) {
      return res.status(500).json({
        message: "YOUTUBE_API_KEY belum diisi di Environment Variables Vercel.",
      });
    }

    const { channelInput, competitors = [], videoLimit = 10 } = req.body || {};

    if (!channelInput) {
      return res.status(400).json({
        message: "Masukkan channel utama terlebih dahulu.",
      });
    }

    const limit = clamp(Number(videoLimit || 10), 1, 50);

    const mainAnalysis = await analyzeOneChannel(channelInput, limit);

    const competitorInputs = Array.isArray(competitors)
      ? competitors.slice(0, 3).filter(Boolean)
      : [];

    const competitorResults = [];

    for (const compInput of competitorInputs) {
      try {
        const comp = await analyzeOneChannel(compInput, Math.min(limit, 15));

        competitorResults.push({
          channel: comp.channel,
          summary: comp.summary,
          scores: comp.scores,
          topVideo: comp.videos.best,
          gapInsight: buildCompetitorInsight(mainAnalysis, comp),
        });
      } catch (error) {
        competitorResults.push({
          channel: {
            title: compInput,
            handle: "",
            subscriberCount: 0,
            hiddenSubscriberCount: true,
          },
          summary: {
            averageViews: 0,
            healthScore: 0,
          },
          topVideo: null,
          gapInsight: `Gagal membaca kompetitor ini: ${error.message}`,
        });
      }
    }

    return res.status(200).json({
      ...mainAnalysis,
      competitors: competitorResults,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Terjadi kesalahan server.",
    });
  }
};
