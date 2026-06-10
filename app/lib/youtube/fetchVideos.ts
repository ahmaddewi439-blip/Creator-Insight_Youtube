export type VideoItem = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  views: number;
  likes: number;
  status: string;
};

export type ChannelInfo = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  subscribers: number;
  totalViews: number;
  totalVideos: number;
};

type SearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    publishedAt?: string;
  };
};

type VideoDetailItem = {
  id?: string;
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
  statistics?: {
    viewCount?: string;
    likeCount?: string;
  };
  status?: {
    privacyStatus?: string;
    publishAt?: string;
  };
};

type ChannelItem = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
};

function getVideoStatus(privacyStatus?: string, publishAt?: string) {
  if (privacyStatus === "private" && publishAt) return "Scheduled";
  if (privacyStatus === "public") return "Published";
  if (privacyStatus === "unlisted") return "Unlisted";
  if (privacyStatus === "private") return "Private";
  return "-";
}

function mapVideo(video: VideoDetailItem): VideoItem {
  const privacyStatus = video.status?.privacyStatus;
  const publishAt = video.status?.publishAt;

  return {
    id: video.id ?? "",
    title: video.snippet?.title ?? "",
    description: video.snippet?.description ?? "",
    thumbnail:
      video.snippet?.thumbnails?.high?.url ??
      video.snippet?.thumbnails?.medium?.url ??
      video.snippet?.thumbnails?.default?.url ??
      "",
    publishedAt: publishAt ?? video.snippet?.publishedAt ?? "",
    channelTitle: video.snippet?.channelTitle ?? "",
    views: Number(video.statistics?.viewCount ?? 0),
    likes: Number(video.statistics?.likeCount ?? 0),
    status: getVideoStatus(privacyStatus, publishAt),
  };
}

async function fetchJson<T>(
  url: URL,
  options?: {
    accessToken?: string;
  }
): Promise<T> {
  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: options?.accessToken
      ? {
          Authorization: `Bearer ${options.accessToken}`,
        }
      : undefined,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || "Gagal mengambil data YouTube.");
  }

  return JSON.parse(text) as T;
}

export async function fetchPublicChannelVideos(): Promise<VideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY belum diisi di Vercel.");
  }

  if (!channelId) {
    throw new Error("YOUTUBE_CHANNEL_ID belum diisi di Vercel.");
  }

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "50");
  searchUrl.searchParams.set("key", apiKey);

  const searchData = await fetchJson<{ items?: SearchItem[] }>(searchUrl);

  const videoIds =
    searchData.items
      ?.map((item) => item.id?.videoId)
      .filter(Boolean)
      .join(",") ?? "";

  if (!videoIds) {
    return [];
  }

  const detailUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailUrl.searchParams.set("part", "snippet,statistics,status");
  detailUrl.searchParams.set("id", videoIds);
  detailUrl.searchParams.set("key", apiKey);

  const detailData = await fetchJson<{ items?: VideoDetailItem[] }>(detailUrl);

  return detailData.items?.map(mapVideo) ?? [];
}

export async function fetchChannelVideos(
  accessToken?: string
): Promise<VideoItem[]> {
  if (!accessToken || accessToken.startsWith("AIza")) {
    return fetchPublicChannelVideos();
  }

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "id,snippet");
  searchUrl.searchParams.set("forMine", "true");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "50");

  const searchData = await fetchJson<{ items?: SearchItem[] }>(searchUrl, {
    accessToken,
  });

  const videoIds =
    searchData.items
      ?.map((item) => item.id?.videoId)
      .filter(Boolean)
      .join(",") ?? "";

  if (!videoIds) {
    return fetchPublicChannelVideos();
  }

  const detailUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailUrl.searchParams.set("part", "snippet,statistics,status");
  detailUrl.searchParams.set("id", videoIds);

  const detailData = await fetchJson<{ items?: VideoDetailItem[] }>(detailUrl, {
    accessToken,
  });

  const videos = detailData.items?.map(mapVideo) ?? [];

  if (videos.length > 0) {
    return videos;
  }

  return fetchPublicChannelVideos();
}

export async function fetchChannelInfo(): Promise<ChannelInfo> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY belum diisi di Vercel.");
  }

  if (!channelId) {
    throw new Error("YOUTUBE_CHANNEL_ID belum diisi di Vercel.");
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("id", channelId);
  url.searchParams.set("key", apiKey);

  const data = await fetchJson<{ items?: ChannelItem[] }>(url);
  const channel = data.items?.[0];

  if (!channel) {
    throw new Error("Channel tidak ditemukan. Cek YOUTUBE_CHANNEL_ID.");
  }

  return {
    id: channel.id ?? "",
    title: channel.snippet?.title ?? "",
    description: channel.snippet?.description ?? "",
    thumbnail:
      channel.snippet?.thumbnails?.high?.url ??
      channel.snippet?.thumbnails?.medium?.url ??
      channel.snippet?.thumbnails?.default?.url ??
      "",
    publishedAt: channel.snippet?.publishedAt ?? "",
    subscribers: Number(channel.statistics?.subscriberCount ?? 0),
    totalViews: Number(channel.statistics?.viewCount ?? 0),
    totalVideos: Number(channel.statistics?.videoCount ?? 0),
  };
}
