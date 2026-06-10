import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { fetchChannelVideos } from "@/app/lib/youtube/fetchVideos";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = session?.accessToken;

    let videos;
    if (accessToken) {
      videos = await fetchChannelVideos(accessToken);
    } else {
      // fallback: pakai API key
      const apiKey = process.env.YOUTUBE_API_KEY!;
      videos = await fetchChannelVideos(apiKey);
    }

    const mapped = videos.map(v => ({
      id: v.videoId,
      title: v.title,
      description: v.description,
      thumbnail: v.thumbnail,
      publishedAt: v.publishedAt,
      status: v.status || "Published",
      views: v.views || 0,
      likes: v.likes || 0
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Failed to fetch YouTube videos:", err);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
