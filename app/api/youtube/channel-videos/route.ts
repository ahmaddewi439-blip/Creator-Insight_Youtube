import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { fetchChannelVideos } from "@/app/lib/youtube/fetchVideos";

export const runtime = "nodejs";
// 🔥 SENJATA 1 & 2: Paksa Next.js jangan pernah menyimpan ingatan (Cache)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;

    let videos;
    if (accessToken) {
      videos = await fetchChannelVideos(accessToken);
    } else {
      videos = await fetchChannelVideos(); 
    }

    const mapped = videos.map(v => ({
      id: v.id || v.videoId,
      title: v.title || v.snippet?.title || "",
      description: v.description || v.snippet?.description || "",
      tags: v.tags || v.snippet?.tags || [],
      thumbnail: v.thumbnail,
      publishedAt: v.publishedAt,
      status: v.status || "Published",
      views: v.views || 0,
      likes: v.likes || 0,
      snippet: v.snippet || {}
    }));

    // 🔥 SENJATA 3: Paksa Browser Chrome Mas Ahmad untuk selalu minta data baru
    return NextResponse.json(mapped, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error("Failed to fetch YouTube videos:", err);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}