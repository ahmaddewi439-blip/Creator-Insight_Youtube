export type VideoItem = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
};

type YouTubeSearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelTitle?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
};

export async function fetchChannelVideos(_auth?: unknown): Promise<VideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY belum diisi.");
  }

  if (!channelId) {
    throw new Error("YOUTUBE_CHANNEL_ID belum diisi.");
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");

  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", "25");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal mengambil video YouTube: ${errorText}`);
  }

  const data = await response.json();
  const items = (data.items ?? []) as YouTubeSearchItem[];

  return items
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      id: item.id?.videoId ?? "",
      title: item.snippet?.title ?? "",
      description: item.snippet?.description ?? "",
      thumbnail:
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.medium?.url ??
        item.snippet?.thumbnails?.default?.url ??
        "",
      publishedAt: item.snippet?.publishedAt ?? "",
      channelTitle: item.snippet?.channelTitle ?? "",
    }));
}