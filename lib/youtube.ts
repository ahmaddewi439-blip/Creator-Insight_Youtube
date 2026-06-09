const YT_BASE = "https://www.googleapis.com/youtube/v3";

type FetchOptions = {
  accessToken?: string;
  apiKey?: string;
  params?: Record<string, string | number | boolean | undefined>;
};

function buildUrl(path: string, params: FetchOptions["params"] = {}, apiKey?: string) {
  const url = new URL(`${YT_BASE}${path}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  if (apiKey) url.searchParams.set("key", apiKey);
  return url.toString();
}

async function youtubeFetch(path: string, options: FetchOptions = {}) {
  const url = buildUrl(path, options.params, options.apiKey);
  const res = await fetch(url, {
    headers: options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : undefined,
    next: { revalidate: 120 }
  });

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!res.ok) {
    const message = data?.error?.message || `YouTube API error ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function getMyChannel(accessToken: string) {
  const data = await youtubeFetch("/channels", {
    accessToken,
    params: { part: "snippet,statistics,contentDetails,brandingSettings", mine: true }
  });
  return data?.items?.[0] || null;
}

export async function getChannelById(channelId: string, apiKey?: string, accessToken?: string) {
  const data = await youtubeFetch("/channels", {
    accessToken,
    apiKey,
    params: { part: "snippet,statistics,contentDetails,brandingSettings", id: channelId }
  });
  return data?.items?.[0] || null;
}

export async function getUploadsPlaylistVideos(playlistId: string, accessToken?: string, apiKey?: string, maxResults = 12) {
  const list = await youtubeFetch("/playlistItems", {
    accessToken,
    apiKey,
    params: { part: "snippet,contentDetails,status", playlistId, maxResults }
  });

  const ids = (list?.items || [])
    .map((item: any) => item?.contentDetails?.videoId)
    .filter(Boolean)
    .join(",");

  if (!ids) return [];

  const details = await youtubeFetch("/videos", {
    accessToken,
    apiKey,
    params: { part: "snippet,statistics,status,contentDetails", id: ids, maxResults }
  });

  return details?.items || [];
}

export async function getMyVideos(accessToken: string, maxResults = 15) {
  const channel = await getMyChannel(accessToken);
  const playlistId = channel?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) return { channel, videos: [] };
  const videos = await getUploadsPlaylistVideos(playlistId, accessToken, undefined, maxResults);
  return { channel, videos };
}

export async function searchCompetitorChannels(query: string, apiKey: string, maxResults = 5) {
  const search = await youtubeFetch("/search", {
    apiKey,
    params: { part: "snippet", type: "channel", q: query, maxResults }
  });

  const ids = (search?.items || [])
    .map((item: any) => item?.snippet?.channelId)
    .filter(Boolean)
    .join(",");

  if (!ids) return [];

  const channels = await youtubeFetch("/channels", {
    apiKey,
    params: { part: "snippet,statistics,contentDetails", id: ids }
  });

  return channels?.items || [];
}

export async function getPublicChannelVideos(channelId: string, apiKey: string, maxResults = 8) {
  const channel = await getChannelById(channelId, apiKey);
  const playlistId = channel?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) return { channel, videos: [] };
  const videos = await getUploadsPlaylistVideos(playlistId, undefined, apiKey, maxResults);
  return { channel, videos };
}

export async function searchRecentRobloxVideos(query: string, apiKey: string, maxResults = 10) {
  const publishedAfter = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();
  const data = await youtubeFetch("/search", {
    apiKey,
    params: {
      part: "snippet",
      type: "video",
      order: "date",
      q: `${query} Roblox update news`.
        replace(/\s+/g, " ").
        trim(),
      publishedAfter,
      maxResults,
      relevanceLanguage: "en"
    }
  });

  return (data?.items || []).map((item: any) => ({
    videoId: item?.id?.videoId,
    title: item?.snippet?.title,
    description: item?.snippet?.description,
    channelTitle: item?.snippet?.channelTitle,
    publishedAt: item?.snippet?.publishedAt,
    thumbnail: item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url,
    url: item?.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : undefined
  }));
}
