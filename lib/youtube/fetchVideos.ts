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

// Perhatikan kita menangkap variabel 'auth' di sini (Token Login)
export async function fetchChannelVideos(auth?: unknown): Promise<VideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!channelId) {
    throw new Error("YOUTUBE_CHANNEL_ID belum diisi di .env.local");
  }

  // =================================================================
  // SENJATA 1: Gunakan Token Login Pemilik Channel (Bukan API Key Publik)
  // Ini paksaan agar YouTube mau membongkar rahasia Hashtag-nya!
  // =================================================================
  const headers: any = {};
  let useApiKey = true;

  if (typeof auth === 'string' && auth.length > 0) {
    headers["Authorization"] = `Bearer ${auth}`;
    useApiKey = false; // Karena pakai token pemilik, buang API Key Publik
  } else if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY belum diisi di .env.local");
  }

  // LANGKAH 1: Ambil ID Video
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "id");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "25");
  if (useApiKey) searchUrl.searchParams.set("key", apiKey!);

  // SENJATA 2: { cache: 'no-store' } 
  // Memaksa Web meminta data paling baru, menghancurkan ingatan masa lalu!
  const searchRes = await fetch(searchUrl.toString(), { headers, cache: 'no-store' });

  if (!searchRes.ok) throw new Error(`Gagal list video: ${await searchRes.text()}`);
  
  const searchData = await searchRes.json();
  const videoIds = (searchData.items ?? []).map((item: any) => item.id?.videoId).filter(Boolean).join(",");
  
  if (!videoIds) return [];

  // LANGKAH 2: Ambil Data VIP (Deskripsi Penuh & Hashtag)
  const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videoUrl.searchParams.set("part", "snippet,statistics");
  videoUrl.searchParams.set("id", videoIds);
  if (useApiKey) videoUrl.searchParams.set("key", apiKey!);

  // SENJATA 2: { cache: 'no-store' }
  const videoRes = await fetch(videoUrl.toString(), { headers, cache: 'no-store' });

  if (!videoRes.ok) throw new Error(`Gagal detail video: ${await videoRes.text()}`);
  
  const videoData = await videoRes.json();

  return (videoData.items ?? []).map((item: any) => ({
    id: item.id ?? "",
    title: item.snippet?.title ?? "",
    // 🔥 HASILNYA: Deskripsi & Hashtag Asli PASTI TEMBUS!
    description: item.snippet?.description ?? "",
    tags: item.snippet?.tags ?? [], 
    thumbnail: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? "",
    publishedAt: item.snippet?.publishedAt ?? "",
    channelTitle: item.snippet?.channelTitle ?? "",
    views: item.statistics?.viewCount ?? "0",
    likes: item.statistics?.likeCount ?? "0",
    snippet: item.snippet
  }));
}