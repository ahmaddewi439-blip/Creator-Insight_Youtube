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

type PlaylistItem = {
  contentDetails?: {
    videoId?: string;
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
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
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

  if (!apiKey) throw new Error("YOUTUBE_API_KEY belum diisi di Vercel.");
  if (!channelId) throw new Error("YOUTUBE_CHANNEL_ID belum diisi di Vercel.");

  // 1. Cari ID Playlist "Uploads" (Hemat Kuota: 1 Poin)
  const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelUrl.searchParams.set("part", "contentDetails");
  channelUrl.searchParams.set("id", channelId);
  channelUrl.searchParams.set("key", apiKey);

  const channelData = await fetchJson<{ items?: ChannelItem[] }>(channelUrl);
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) return [];

  // 2. Ambil ID Video dari Playlist (Hemat Kuota: 1 Poin)
  const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  playlistUrl.searchParams.set("part", "contentDetails");
  playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
  playlistUrl.searchParams.set("maxResults", "50");
  playlistUrl.searchParams.set("key", apiKey);

  const playlistData = await fetchJson<{ items?: PlaylistItem[] }>(playlistUrl);
  const videoIds = playlistData.items?.map((item) => item.contentDetails?.videoId).filter(Boolean).join(",") ?? "";

  if (!videoIds) return [];

  // 3. Ambil Detail Lengkap Video (Hemat Kuota: 1 Poin)
  const detailUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailUrl.searchParams.set("part", "snippet,statistics,status");
  detailUrl.searchParams.set("id", videoIds);
  detailUrl.searchParams.set("key", apiKey);

  const detailData = await fetchJson<{ items?: VideoDetailItem[] }>(detailUrl);
  return detailData.items?.map(mapVideo) ?? [];
}

export async function fetchChannelVideos(accessToken?: string): Promise<VideoItem[]> {
  if (!accessToken || accessToken.startsWith("AIza")) {
    return fetchPublicChannelVideos();
  }

  // 1. Cari ID Playlist "Uploads" milik user yang login (Hemat Kuota: 1 Poin)
  const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelUrl.searchParams.set("part", "contentDetails");
  channelUrl.searchParams.set("mine", "true");

  const channelData = await fetchJson<{ items?: ChannelItem[] }>(channelUrl, { accessToken });
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) return fetchPublicChannelVideos();

  // 2. Ambil ID Video dari Playlist (Hemat Kuota: 1 Poin)
  const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  playlistUrl.searchParams.set("part", "contentDetails");
  playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
  playlistUrl.searchParams.set("maxResults", "50");

  const playlistData = await fetchJson<{ items?: PlaylistItem[] }>(playlistUrl, { accessToken });
  const videoIds = playlistData.items?.map((item) => item.contentDetails?.videoId).filter(Boolean).join(",") ?? "";

  if (!videoIds) return fetchPublicChannelVideos();

  // 3. Ambil Detail Lengkap Video (Hemat Kuota: 1 Poin)
  const detailUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailUrl.searchParams.set("part", "snippet,statistics,status");
  detailUrl.searchParams.set("id", videoIds);

  const detailData = await fetchJson<{ items?: VideoDetailItem[] }>(detailUrl, { accessToken });
  const videos = detailData.items?.map(mapVideo) ?? [];

  return videos.length > 0 ? videos : fetchPublicChannelVideos();
}

export async function fetchChannelInfo(): Promise<ChannelInfo> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey) throw new Error("YOUTUBE_API_KEY belum diisi di Vercel.");
  if (!channelId) throw new Error("YOUTUBE_CHANNEL_ID belum diisi di Vercel.");

  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("id", channelId);
  url.searchParams.set("key", apiKey);

  const data = await fetchJson<{ items?: ChannelItem[] }>(url);
  const channel = data.items?.[0];

  if (!channel) throw new Error("Channel tidak ditemukan. Cek YOUTUBE_CHANNEL_ID.");

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