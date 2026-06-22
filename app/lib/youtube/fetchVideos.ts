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

export async function fetchChannelVideos(auth?: unknown): Promise<any[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  const headers: any = {};
  let useApiKey = true;

  // Cek apakah ada token login dari session
  if (typeof auth === 'string' && auth.length > 0) {
    headers["Authorization"] = `Bearer ${auth}`;
    useApiKey = false;
  }

  // =================================================================
  // LANGKAH 1: Ambil List ID Video (Bypass Filter YouTube)
  // =================================================================
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "id");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "25");

  if (useApiKey) {
    // Mode Publik: Hanya muncul video Published
    if (!channelId || !apiKey) return [];
    searchUrl.searchParams.set("channelId", channelId);
    searchUrl.searchParams.set("key", apiKey as string);
  } else {
    // 🔥 MODE VIP: Tarik SEMUA Video termasuk Private & Scheduled 🔥
    searchUrl.searchParams.set("forMine", "true");
  }

  const searchRes = await fetch(searchUrl.toString(), { headers, cache: 'no-store' });
  if (!searchRes.ok) throw new Error(`Search Error: ${await searchRes.text()}`);

  const searchData = await searchRes.json();
  const videoIds = (searchData.items ?? []).map((item: any) => item.id?.videoId).filter(Boolean).join(",");

  if (!videoIds) return [];

  // =================================================================
  // LANGKAH 2: Tarik Full Data VIP (Deskripsi & Tags Utuh)
  // =================================================================
  const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videoUrl.searchParams.set("part", "snippet,statistics");
  videoUrl.searchParams.set("id", videoIds);
  if (useApiKey) videoUrl.searchParams.set("key", apiKey as string);

  const videoRes = await fetch(videoUrl.toString(), { headers, cache: 'no-store' });
  if (!videoRes.ok) throw new Error(`Videos Error: ${await videoRes.text()}`);

  const videoData = await videoRes.json();

  return (videoData.items ?? []).map((item: any) => ({
    id: item.id ?? "",
    title: item.snippet?.title ?? "",
    description: item.snippet?.description ?? "",
    tags: item.snippet?.tags ?? [],
    thumbnail: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? "",
    publishedAt: item.snippet?.publishedAt ?? "",
    channelTitle: item.snippet?.channelTitle ?? "",
    views: item.statistics?.viewCount ?? "0",
    likes: item.statistics?.likeCount ?? "0",
    snippet: item.snippet || {}
  }));
}

// 🔥 KEMBALIKAN FUNGSI AGAR VERCEL TIDAK ERROR 🔥
export async function fetchPublicChannelVideos() {
  return fetchChannelVideos();
}

export async function fetchChannelInfo(auth?: unknown) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) return null;

  const headers: any = {};
  let useApiKey = true;

  if (typeof auth === 'string' && auth.length > 0) {
    headers["Authorization"] = `Bearer ${auth}`;
    useApiKey = false;
  } else if (!apiKey) {
    return null;
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("id", channelId);
  if (useApiKey) url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), { headers, cache: 'no-store' });
    const data = await res.json();
    return data.items?.[0] || null;
  } catch (error) {
    return null;
  }
}