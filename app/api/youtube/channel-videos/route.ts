import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchChannelVideos } from "@/app/lib/youtube/fetchVideos";

export const runtime = "nodejs";

type PublicSearchItem = {
  id?: {
    videoId?: string;
  };
};

type PublicVideoItem = {
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
};

async function fetchPublicChannelVideos() {
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
  searchUrl.searchParams.set("maxResults", "25");
  searchUrl.searchParams.set("key", apiKey);

  const searchResponse = await fetch(searchUrl.toString(), {
    cache: "no-store",
  });

  if (!searchResponse.ok) {
    const errorText = await searchResponse.text();
    throw new Error(`Gagal mengambil video public: ${errorText}`);
  }

  const searchData = await searchResponse.json();

  const videoIds = ((searchData.items ?? []) as PublicSearchItem[])
    .map((item) => item.id?.videoId)
    .filter(Boolean)
    .join(",");

  if (!videoIds) {
    return [];
  }

  const detailUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailUrl.searchParams.set("part", "snippet,statistics");
  detailUrl.searchParams.set("id", videoIds);
  detailUrl.searchParams.set("key", apiKey);

  const detailResponse = await fetch(detailUrl.toString(), {
    cache: "no-store",
  });

  if (!detailResponse.ok) {
    const errorText = await detailResponse.text();
    throw new Error(`Gagal mengambil detail video public: ${errorText}`);
  }

  const detailData = await detailResponse.json();

  return ((detailData.items ?? []) as PublicVideoItem[]).map((video) => ({
    id: video.id ?? "",
    title: video.snippet?.title ?? "",
    description: video.snippet?.description ?? "",
    thumbnail:
      video.snippet?.thumbnails?.high?.url ??
      video.snippet?.thumbnails?.medium?.url ??
      video.snippet?.thumbnails?.default?.url ??
      "",
    publishedAt: video.snippet?.publishedAt ?? "",
    channelTitle: video.snippet?.channelTitle ?? "",
    views: Number(video.statistics?.viewCount ?? 0),
    likes: Number(video.statistics?.likeCount ?? 0),
    status: "Published",
  }));
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;

    if (accessToken) {
      try {
        const videos = await fetchChannelVideos(accessToken);

        return NextResponse.json({
          videos,
          count: videos.length,
          source: "oauth",
        });
      } catch (oauthError) {
        console.error("OAuth video fetch failed:", oauthError);
      }
    }

    const publicVideos = await fetchPublicChannelVideos();

    return NextResponse.json({
      videos: publicVideos,
      count: publicVideos.length,
      source: "api-key-public",
      note:
        "OAuth session belum terbaca, jadi yang tampil hanya video public. Scheduled butuh OAuth.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        videos: [],
        count: 0,
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil video YouTube.",
      },
      { status: 500 }
    );
  }
}