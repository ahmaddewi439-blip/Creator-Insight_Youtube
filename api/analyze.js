const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

function toNumber(value) {
  return Number(value || 0);
}

function average(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  return numbers.reduce((sum, item) => sum + Number(item || 0), 0) / numbers.length;
}

function parseDurationToSeconds(duration) {
  if (!duration) return 0;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) return 0;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
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
    const message =
      data.error?.message ||
      "Gagal mengambil data dari YouTube API.";

    throw new Error(message);
  }

  return data;
}

async function getChannelById(channelId) {
  const data = await youtubeRequest("channels", {
    part: "snippet,statistics,contentDetails",
    id: channelId,
  });

  return data.items?.[0] || null;
}

async function resolveChannel(channelInput) {
  const parsed = extractInput(channelInput);

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

  const searchData = await youtubeRequest("search", {
    part: "snippet",
    type: "channel",
    maxResults: "1",
    q: parsed.value,
  });

  const foundChannelId = searchData.items?.[0]?.snippet?.channelId;

  if (!foundChannelId) {
    throw new Error("Channel tidak ditemukan. Coba gunakan link channel yang lengkap atau handle @channel.");
  }

  const channel = await getChannelById(foundChannelId);

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

async function getVideoDetails(videoIds) {
  if (!videoIds || videoIds.length === 0) return [];

  const data = await youtubeRequest("videos", {
    part: "snippet,statistics,contentDetails",
    id: videoIds.join(","),
    maxResults: "50",
  });

  return (data.items || []).map((item) => {
    const statistics = item.statistics || {};
    const snippet = item.snippet || {};
    const contentDetails = item.contentDetails || {};

    return {
      id: item.id,
      title: snippet.title || "Tanpa Judul",
      description: snippet.description || "",
      publishedAt: snippet.publishedAt,
      thumbnail: getBestThumbnail(snippet.thumbnails),
      viewCount: toNumber(statistics.viewCount),
      likeCount: toNumber(statistics.likeCount),
      commentCount: toNumber(statistics.commentCount),
      durationSeconds: parseDurationToSeconds(contentDetails.duration),
    };
  });
}

function calculateUploadGapDays(videos) {
  if (!videos || videos.length < 2) return 0;

  const dates = videos
    .map((video) => new Date(video.publishedAt).getTime())
    .filter(Boolean)
    .sort((a, b) => b - a);

  const gaps = [];

  for (let i = 0; i < dates.length - 1; i++) {
    const diff = Math.abs(dates[i] - dates[i + 1]);
    gaps.push(diff / (1000 * 60 * 60 * 24));
  }

  return average(gaps);
}

function buildAnalysis(channel, videos) {
  const stats = channel.statistics || {};
  const snippet = channel.snippet || {};

  const subscriberCount = toNumber(stats.subscriberCount);
  const totalViews = toNumber(stats.viewCount);
  const totalVideos = toNumber(stats.videoCount);
  const hiddenSubscriberCount = Boolean(stats.hiddenSubscriberCount);

  const viewCounts = videos.map((video) => video.viewCount);
  const likeCounts = videos.map((video) => video.likeCount);
  const commentCounts = videos.map((video) => video.commentCount);

  const averageViews = Math.round(average(viewCounts));
  const averageLikes = Math.round(average(likeCounts));
  const averageComments = Math.round(average(commentCounts));

  const totalAnalyzedViews = viewCounts.reduce((sum, value) => sum + value, 0);
  const totalAnalyzedEngagement =
    likeCounts.reduce((sum, value) => sum + value, 0) +
    commentCounts.reduce((sum, value) => sum + value, 0);

  const engagementRate =
    totalAnalyzedViews > 0
      ? (totalAnalyzedEngagement / totalAnalyzedViews) * 100
      : 0;

  const half = Math.max(Math.floor(videos.length / 2), 1);
  const recentVideos = videos.slice(0, half);
  const olderVideos = videos.slice(half);

  const recentAvg = average(recentVideos.map((video) => video.viewCount));
  const olderAvg = average(olderVideos.map((video) => video.viewCount));

  const growthPercentage =
    olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

  const avgUploadGapDays = calculateUploadGapDays(videos);

  const best = videos.length
    ? videos.reduce((max, video) => (video.viewCount > max.viewCount ? video : max), videos[0])
    : null;

  const weakest = videos.length
    ? videos.reduce((min, video) => (video.viewCount < min.viewCount ? video : min), videos[0])
    : null;

  let trendScore = 50;
  if (growthPercentage > 30) trendScore = 90;
  else if (growthPercentage > 10) trendScore = 75;
  else if (growthPercentage > -10) trendScore = 60;
  else if (growthPercentage > -30) trendScore = 40;
  else trendScore = 25;

  let engagementScore = 40;
  if (engagementRate >= 5) engagementScore = 90;
  else if (engagementRate >= 2) engagementScore = 75;
  else if (engagementRate >= 1) engagementScore = 60;
  else if (engagementRate >= 0.4) engagementScore = 45;
  else engagementScore = 25;

  let consistencyScore = 50;
  if (avgUploadGapDays > 0 && avgUploadGapDays <= 3) consistencyScore = 90;
  else if (avgUploadGapDays <= 7) consistencyScore = 75;
  else if (avgUploadGapDays <= 14) consistencyScore = 55;
  else consistencyScore = 35;

  let audienceScore = 60;
  if (!hiddenSubscriberCount && subscriberCount > 0) {
    const viewToSubRate = (averageViews / subscriberCount) * 100;

    if (viewToSubRate >= 30) audienceScore = 95;
    else if (viewToSubRate >= 15) audienceScore = 80;
    else if (viewToSubRate >= 7) audienceScore = 65;
    else if (viewToSubRate >= 3) audienceScore = 45;
    else audienceScore = 25;
  }

  const healthScore = Math.round(
    trendScore * 0.35 +
      engagementScore * 0.25 +
      consistencyScore * 0.2 +
      audienceScore * 0.2
  );

  let growthStatus = "Stabil";
  if (growthPercentage > 15) growthStatus = "Naik";
  if (growthPercentage < -15) growthStatus = "Turun";

  let diagnosisTitle = "Channel Cukup Sehat";
  let diagnosisText =
    "Channel memiliki performa yang cukup stabil. Fokus utama sekarang adalah memperkuat pola konten terbaik dan menjaga konsistensi upload.";

  if (videos.length === 0) {
    diagnosisTitle = "Data Video Belum Cukup";
    diagnosisText =
      "Sistem belum menemukan video terbaru untuk dianalisa. Pastikan channel memiliki video publik.";
  } else if (growthPercentage < -25) {
    diagnosisTitle = "Growth Bottleneck";
    diagnosisText =
      "Performa video terbaru terlihat menurun dibanding video sebelumnya. Ini biasanya terjadi karena topik mulai kurang menarik, judul kurang kuat, atau pola konten tidak lagi sesuai dengan minat audience.";
  } else if (!hiddenSubscriberCount && subscriberCount > 0 && averageViews < subscriberCount * 0.03) {
    diagnosisTitle = "Audience Tidak Terserap";
    diagnosisText =
      "Rata-rata view video terbaru masih rendah dibanding jumlah subscriber. Artinya subscriber belum banyak terdorong untuk klik video baru. Perlu perbaikan pada judul, thumbnail, dan angle topik.";
  } else if (engagementRate < 0.5) {
    diagnosisTitle = "Engagement Rendah";
    diagnosisText =
      "Like dan komentar masih rendah dibanding jumlah view. Konten perlu dibuat lebih interaktif dengan pertanyaan, opini, konflik ringan, atau call to action yang lebih natural.";
  } else if (avgUploadGapDays > 14) {
    diagnosisTitle = "Upload Tidak Konsisten";
    diagnosisText =
      "Jarak upload antar video cukup jauh. Konsistensi upload sangat berpengaruh pada sinyal channel dan kebiasaan audience untuk kembali menonton.";
  }

  const recommendations = [];

  if (best) {
    recommendations.push(
      `Ulangi pola dari video terbaik "${best.title}" karena video tersebut memberi sinyal topik yang paling disukai audience.`
    );
  }

  if (growthPercentage < 0) {
    recommendations.push(
      "Perbaiki 3 detik pertama video, judul, dan thumbnail karena performa terbaru menunjukkan tanda penurunan."
    );
  }

  if (engagementRate < 1) {
    recommendations.push(
      "Tambahkan pertanyaan di akhir video agar penonton terdorong komentar, misalnya meminta opini atau pengalaman mereka."
    );
  }

  if (avgUploadGapDays > 7) {
    recommendations.push(
      "Buat jadwal upload yang lebih konsisten, minimal 2–3 kali seminggu untuk menjaga momentum channel."
    );
  }

  recommendations.push(
    "Gunakan format judul yang lebih spesifik, misalnya mengandung angka, masalah, hasil, atau rasa penasaran."
  );

  recommendations.push(
    "Buat variasi konten dari video terbaik: part 2, update terbaru, kesalahan umum, tutorial cepat, atau studi kasus."
  );

  const ideas = [];

  if (best) {
    ideas.push(`Buat video lanjutan dari topik: ${best.title}`);
    ideas.push(`Buat versi lebih singkat dan lebih padat dari video terbaik tersebut.`);
  }

  ideas.push("Buat konten: 5 kesalahan yang membuat channel YouTube sulit berkembang.");
  ideas.push("Buat konten: Bedah channel kecil yang berhasil naik cepat.");
  ideas.push("Buat konten: Strategi upload 7 hari untuk menaikkan performa channel.");
  ideas.push("Buat konten: Cara membuat judul dan thumbnail yang lebih mudah diklik.");

  return {
    channel: {
      id: channel.id,
      title: snippet.title,
      handle: snippet.customUrl || "",
      avatar: getBestThumbnail(snippet.thumbnails),
      publishedAt: snippet.publishedAt,
      subscriberCount,
      hiddenSubscriberCount,
      viewCount: totalViews,
      videoCount: totalVideos,
    },
    summary: {
      analyzedVideos: videos.length,
      averageViews,
      averageLikes,
      averageComments,
      engagementRate: Number(engagementRate.toFixed(2)),
      recentAvg: Math.round(recentAvg),
      olderAvg: Math.round(olderAvg),
      growthPercentage: Number(growthPercentage.toFixed(2)),
      growthStatus,
      avgUploadGapDays: Number(avgUploadGapDays.toFixed(1)),
      healthScore,
    },
    diagnosis: {
      title: diagnosisTitle,
      text: diagnosisText,
    },
    videos: {
      items: videos,
      best,
      weakest,
    },
    recommendations,
    ideas,
  };
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

    const { channelInput, videoLimit } = req.body || {};

    if (!channelInput) {
      return res.status(400).json({
        message: "Masukkan link channel, handle, atau Channel ID.",
      });
    }

    const limit = Math.min(Math.max(Number(videoLimit || 10), 1), 50);

    const channel = await resolveChannel(channelInput);
    const uploadPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadPlaylistId) {
      return res.status(404).json({
        message: "Playlist upload channel tidak ditemukan.",
      });
    }

    const videoIds = await getLatestVideoIds(uploadPlaylistId, limit);
    const videos = await getVideoDetails(videoIds);

    const result = buildAnalysis(channel, videos);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Terjadi kesalahan server.",
    });
  }
};
