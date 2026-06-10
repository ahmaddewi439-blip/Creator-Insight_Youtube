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

type SearchItem = {
  id?: {
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

function getAccessTokenFromAuth(auth: unknown): string {
  if (typeof auth === "string") {
    return auth;
  }

  if (auth && typeof auth === "object" && "accessToken" in auth) {
    return String((auth as { accessToken?: string }).accessToken ?? "");
  }

  return "";
}

export async function fetchChannelVideos(auth: unknown): Promise<VideoItem[]> {
  const accessToken = getAccessTokenFromAuth(auth);

  if (!accessToken || accessToken.startsWith("AIza")) {
    throw new Error(
      "Akses video publish dan scheduled butuh Google OAuth. Silakan logout lalu login Google lagi."
    );
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "id");
  searchUrl.searchParams.set("forMine", "true");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "25");

  const searchResponse = await fetch(searchUrl.toString(), { headers });

  if (!searchResponse.ok) {
    const errorText = await searchResponse.text();
    throw new Error(`Gagal membaca daftar video YouTube: ${errorText}`);
  }

  const searchData = await searchResponse.json();
  const videoIds = ((searchData.items ?? []) as SearchItem[])
    .map((item) => item.id?.videoId)
    .filter(Boolean)
    .join(",");

  if (!videoIds) {
    return [];
  }

  const detailUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailUrl.searchParams.set("part", "snippet,statistics,status");
  detailUrl.searchParams.set("id", videoIds);

  const detailResponse = await fetch(detailUrl.toString(), { headers });

  if (!detailResponse.ok) {
    const errorText = await detailResponse.text();
    throw new Error(`Gagal membaca detail video YouTube: ${errorText}`);
  }

  const detailData = await detailResponse.json();
  const items = (detailData.items ?? []) as VideoDetailItem[];

  return items.map((video) => {
    const privacyStatus = video.status?.privacyStatus ?? "-";
    const isScheduled = privacyStatus === "private" && Boolean(video.status?.publishAt);

    return {
      id: video.id ?? "",
      title: video.snippet?.title ?? "",
      description: video.snippet?.description ?? "",
      thumbnail:
        video.snippet?.thumbnails?.high?.url ??
        video.snippet?.thumbnails?.medium?.url ??
        video.snippet?.thumbnails?.default?.url ??
        "",
      publishedAt: video.status?.publishAt ?? video.snippet?.publishedAt ?? "",
      channelTitle: video.snippet?.channelTitle ?? "",
      views: Number(video.statistics?.viewCount ?? 0),
      likes: Number(video.statistics?.likeCount ?? 0),
      status: isScheduled ? "Scheduled" : privacyStatus,
    };
  });
}