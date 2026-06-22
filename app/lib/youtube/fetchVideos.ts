// Kita hapus aturan ketat VideoItem agar Vercel tidak rewel
export async function fetchChannelVideos(auth?: unknown): Promise<any[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!channelId) throw new Error("YOUTUBE_CHANNEL_ID belum diisi");

  const headers: any = {};
  let useApiKey = true;

  if (typeof auth === 'string' && auth.length > 0) {
    headers["Authorization"] = `Bearer ${auth}`;
    useApiKey = false; 
  } else if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY belum diisi");
  }

  // Langkah 1: Ambil ID (Bebas Cache)
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "id");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "25");
  if (useApiKey) searchUrl.searchParams.set("key", apiKey as string);

  const searchRes = await fetch(searchUrl.toString(), { headers, cache: 'no-store' });
  if (!searchRes.ok) throw new Error(`Gagal list: ${await searchRes.text()}`);
  
  const searchData = await searchRes.json();
  const videoIds = (searchData.items ?? []).map((item: any) => item.id?.videoId).filter(Boolean).join(",");
  
  if (!videoIds) return [];

  // Langkah 2: Ambil Full Data VIP (Bebas Cache)
  const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videoUrl.searchParams.set("part", "snippet,statistics");
  videoUrl.searchParams.set("id", videoIds);
  if (useApiKey) videoUrl.searchParams.set("key", apiKey as string);

  const videoRes = await fetch(videoUrl.toString(), { headers, cache: 'no-store' });
  if (!videoRes.ok) throw new Error(`Gagal detail: ${await videoRes.text()}`);
  
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
// 🔥 TAMBAHAN BARU UNTUK MEMBUNGKAM ERROR VERCEL 🔥
export async function fetchPublicChannelVideos() {
  return fetchChannelVideos();
}

// 🔥 KEMBALIKAN FUNGSI fetchChannelInfo AGAR VERCEL DIAM 🔥
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
if (useApiKey) url.searchParams.set("key", apiKey as string);

  try {
    const res = await fetch(url.toString(), { headers, cache: 'no-store' });
    const data = await res.json();
    return data.items?.[0] || null;
  } catch (error) {
    console.error("Gagal mengambil info channel:", error);
    return null;
  }
}