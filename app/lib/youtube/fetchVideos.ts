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

type ChannelResponse = {
  items?: Array<{
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
};

type PlaylistItemsResponse = {
  items?: Array<{
    contentDetails?: {
      videoId?: string;
    };
  }>;
};

type VideoDetailsResponse = {
  items?: Array<{
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
  }>;
};

async function youtubeFetch<T>(url: URL, accessToken: string): Promise<T> {
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json() as Promise<T>;
}

function getVideoStatus(privacyStatus?: string, publishAt?: string) {
  if (privacyStatus === "private" && publishAt) return "Scheduled";
  if (privacyStatus === "public") return "Published";
  if (privacyStatus === "unlisted") return "Unlisted";
  if (privacyStatus === "private") return "Private";
  return "-";
}

export async function fetchChannelVideos(accessToken: string): Promise<VideoItem[]> {
  if (!accessToken || accessToken.startsWith("AIza")) {
    throw new Error(
      "Token Google OAuth tidak terbaca. Logout lalu login Google lagi dan izinkan akses YouTube."
    );
  }

  const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelUrl.searchParams.set("part", "contentDetails");
  channelUrl.searchParams.set("mine", "true");

  const channelData = await youtubeFetch<ChannelResponse>(channelUrl, accessToken);

  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    return [];
  }

  const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  playlistUrl.searchParams.set("part", "contentDetails");
  playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
  playlistUrl.searchParams.set("maxResults", "25");

  const playlistData = await youtubeFetch<PlaylistItemsResponse>(
    playlistUrl,
    accessToken
  );

  const videoIds =
    playlistData.items
      ?.map((item) => item.contentDetails?.videoId)
      .filter(Boolean)
      .join(",") ?? "";

  if (!videoIds) {
    return [];
  }

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "snippet,statistics,status");
  videosUrl.searchParams.set("id", videoIds);

  const videosData = await youtubeFetch<VideoDetailsResponse>(
    videosUrl,
    accessToken
  );

  return (
    videosData.items?.map((video) => {
      const publishAt = video.status?.publishAt;
      const privacyStatus = video.status?.privacyStatus;

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
    }) ?? []
  );
}