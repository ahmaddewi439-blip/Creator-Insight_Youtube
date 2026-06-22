export type VideoItem = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  tags?: string[];
  views?: string;
  likes?: string;
  snippet?: any;
};

export async function fetchChannelVideos(_auth?: unknown): Promise<VideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY belum diisi di .env.local");
  }

  if (!channelId) {
    throw new Error("YOUTUBE_CHANNEL_ID belum diisi di .env.local");
  }

  // =================================================================
  // LANGKAH 1: Ambil daftar ID Video saja (Paket Hemat)
  // =================================================================
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "id"); // Kita paksa cuma minta ID-nya saja
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "25");
  searchUrl.searchParams.set("key", apiKey);

  const searchRes = await fetch(searchUrl.toString());

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Gagal mengambil list video: ${errorText}`);
  }

  const searchData = await searchRes.json();
  
  // Gabungkan semua ID Video dengan tanda koma (Contoh: "id1,id2,id3")
  const videoIds = (searchData.items ?? [])
    .map((item: any) => item.id?.videoId)
    .filter(Boolean)
    .join(",");

  // Kalau channelnya kosong, kembalikan array kosong
  if (!videoIds) return [];

  // =================================================================
  // LANGKAH 2: Paksa YouTube kirim Paket VIP (Full Deskripsi & Hashtag)
  // =================================================================
  const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videoUrl.searchParams.set("part", "snippet,statistics"); // snippet = teks/tags, statistics = view/like
  videoUrl.searchParams.set("id", videoIds);
  videoUrl.searchParams.set("key", apiKey);

  const videoRes = await fetch(videoUrl.toString());

  if (!videoRes.ok) {
    const errorText = await videoRes.text();
    throw new Error(`Gagal mengambil detail video VIP: ${errorText}`);
  }

  const videoData = await videoRes.json();

  // Kembalikan data utuh ke web Mas Ahmad
  return (videoData.items ?? []).map((item: any) => ({
    id: item.id ?? "",
    title: item.snippet?.title ?? "",
    // 🔥 INI SEKARANG 100% FULL DESKRIPSI!
    description: item.snippet?.description ?? "",
    // 🔥 INI DIA HASHTAG YANG DISEMBUYIKAN YOUTUBE SELAMA 3 JAM!
    tags: item.snippet?.tags ?? [], 
    thumbnail:
      item.snippet?.thumbnails?.high?.url ??
      item.snippet?.thumbnails?.medium?.url ??
      item.snippet?.thumbnails?.default?.url ??
      "",
    publishedAt: item.snippet?.publishedAt ?? "",
    channelTitle: item.snippet?.channelTitle ?? "",
    views: item.statistics?.viewCount ?? "0",
    likes: item.statistics?.likeCount ?? "0",
    snippet: item.snippet
  }));
}