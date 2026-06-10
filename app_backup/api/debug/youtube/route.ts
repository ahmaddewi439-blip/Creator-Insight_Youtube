import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

async function requestJson(url: URL, accessToken?: string) {
  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  const text = await response.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text.slice(0, 500);
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

function getError(data: any) {
  return data?.error?.message ?? data?.error ?? null;
}

function safeItems(data: any) {
  return Array.isArray(data?.items) ? data.items : [];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.accessToken as string | undefined;

  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  const result: any = {
    env: {
      hasYoutubeApiKey: Boolean(apiKey),
      hasYoutubeChannelId: Boolean(channelId),
      hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
      hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
      hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
    },
    session: {
      signedIn: Boolean(session),
      hasAccessToken: Boolean(accessToken),
      accessTokenLooksLikeApiKey: Boolean(accessToken?.startsWith("AIza")),
    },
  };

  if (accessToken) {
    const tokenInfoUrl = new URL("https://www.googleapis.com/oauth2/v3/tokeninfo");
    tokenInfoUrl.searchParams.set("access_token", accessToken);

    const tokenInfo = await requestJson(tokenInfoUrl);

    result.oauthTokenInfo = {
      ok: tokenInfo.ok,
      status: tokenInfo.status,
      hasYoutubeReadonlyScope: String(tokenInfo.data?.scope ?? "").includes(
        "https://www.googleapis.com/auth/youtube.readonly"
      ),
      scope: tokenInfo.data?.scope ?? null,
      error: getError(tokenInfo.data),
    };

    const mineChannelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    mineChannelUrl.searchParams.set(
      "part",
      "id,snippet,statistics,contentDetails"
    );
    mineChannelUrl.searchParams.set("mine", "true");

    const mineChannel = await requestJson(mineChannelUrl, accessToken);
    const mineChannelItems = safeItems(mineChannel.data);

    result.oauthMineChannel = {
      ok: mineChannel.ok,
      status: mineChannel.status,
      count: mineChannelItems.length,
      error: getError(mineChannel.data),
      items: mineChannelItems.slice(0, 3).map((item: any) => ({
        id: item.id,
        title: item.snippet?.title,
        subscriberCount: item.statistics?.subscriberCount,
        videoCount: item.statistics?.videoCount,
        uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads,
      })),
    };

    const searchMineUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchMineUrl.searchParams.set("part", "snippet");
    searchMineUrl.searchParams.set("forMine", "true");
    searchMineUrl.searchParams.set("type", "video");
    searchMineUrl.searchParams.set("order", "date");
    searchMineUrl.searchParams.set("maxResults", "10");

    const searchMine = await requestJson(searchMineUrl, accessToken);
    const searchMineItems = safeItems(searchMine.data);

    result.oauthSearchForMine = {
      ok: searchMine.ok,
      status: searchMine.status,
      count: searchMineItems.length,
      error: getError(searchMine.data),
      items: searchMineItems.slice(0, 5).map((item: any) => ({
        videoId: item.id?.videoId,
        title: item.snippet?.title,
        publishedAt: item.snippet?.publishedAt,
      })),
    };

    const uploadsPlaylistId =
      mineChannelItems[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (uploadsPlaylistId) {
      const playlistUrl = new URL(
        "https://www.googleapis.com/youtube/v3/playlistItems"
      );
      playlistUrl.searchParams.set("part", "snippet,contentDetails");
      playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
      playlistUrl.searchParams.set("maxResults", "10");

      const playlist = await requestJson(playlistUrl, accessToken);
      const playlistItems = safeItems(playlist.data);

      result.oauthUploadsPlaylist = {
        ok: playlist.ok,
        status: playlist.status,
        count: playlistItems.length,
        error: getError(playlist.data),
        items: playlistItems.slice(0, 5).map((item: any) => ({
          videoId: item.contentDetails?.videoId,
          title: item.snippet?.title,
          publishedAt: item.contentDetails?.videoPublishedAt,
        })),
      };

      const videoIds = playlistItems
        .map((item: any) => item.contentDetails?.videoId)
        .filter(Boolean)
        .join(",");

      if (videoIds) {
        const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
        videosUrl.searchParams.set("part", "snippet,statistics,status");
        videosUrl.searchParams.set("id", videoIds);

        const videos = await requestJson(videosUrl, accessToken);
        const videoItems = safeItems(videos.data);

        result.oauthVideoDetails = {
          ok: videos.ok,
          status: videos.status,
          count: videoItems.length,
          error: getError(videos.data),
          items: videoItems.slice(0, 5).map((item: any) => ({
            id: item.id,
            title: item.snippet?.title,
            privacyStatus: item.status?.privacyStatus,
            publishAt: item.status?.publishAt,
            viewCount: item.statistics?.viewCount,
            likeCount: item.statistics?.likeCount,
          })),
        };
      }
    }
  }

  if (apiKey && channelId) {
    const publicChannelUrl = new URL(
      "https://www.googleapis.com/youtube/v3/channels"
    );
    publicChannelUrl.searchParams.set(
      "part",
      "id,snippet,statistics,contentDetails"
    );
    publicChannelUrl.searchParams.set("id", channelId);
    publicChannelUrl.searchParams.set("key", apiKey);

    const publicChannel = await requestJson(publicChannelUrl);
    const publicChannelItems = safeItems(publicChannel.data);

    result.apiKeyChannelById = {
      ok: publicChannel.ok,
      status: publicChannel.status,
      count: publicChannelItems.length,
      error: getError(publicChannel.data),
      items: publicChannelItems.slice(0, 3).map((item: any) => ({
        id: item.id,
        title: item.snippet?.title,
        subscriberCount: item.statistics?.subscriberCount,
        videoCount: item.statistics?.videoCount,
      })),
    };

    const publicSearchUrl = new URL(
      "https://www.googleapis.com/youtube/v3/search"
    );
    publicSearchUrl.searchParams.set("part", "snippet");
    publicSearchUrl.searchParams.set("channelId", channelId);
    publicSearchUrl.searchParams.set("type", "video");
    publicSearchUrl.searchParams.set("order", "date");
    publicSearchUrl.searchParams.set("maxResults", "10");
    publicSearchUrl.searchParams.set("key", apiKey);

    const publicSearch = await requestJson(publicSearchUrl);
    const publicSearchItems = safeItems(publicSearch.data);

    result.apiKeyPublicSearch = {
      ok: publicSearch.ok,
      status: publicSearch.status,
      count: publicSearchItems.length,
      error: getError(publicSearch.data),
      items: publicSearchItems.slice(0, 5).map((item: any) => ({
        videoId: item.id?.videoId,
        title: item.snippet?.title,
        publishedAt: item.snippet?.publishedAt,
      })),
    };
  }

  return NextResponse.json(result);
}