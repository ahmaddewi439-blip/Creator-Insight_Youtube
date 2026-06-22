import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { fetchChannelVideos } from "@/app/lib/youtube/fetchVideos";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;

    let videos;
    if (accessToken) {
      videos = await fetchChannelVideos(accessToken);
    } else {
      // fallback: pakai API key
      const apiKey = process.env.YOUTUBE_API_KEY!;
      videos = await fetchChannelVideos(); // fallback pakai API key internal
    }

    const mapped = videos.map(v => ({
      id: v.videoId || v.id,
      title: v.title || v.snippet?.title || "",
      // 🔥 KITA AMANKAN DESKRIPSI FULL-NYA DI SINI
      description: v.description || v.snippet?.description || "",
      // 🔥 INI DIA PIPA HASHTAG YANG HILANG SELAMA 3 JAM!
      tags: v.tags || v.snippet?.tags || [], 
      thumbnail: v.thumbnail,
      publishedAt: v.publishedAt,
      status: v.status || "Published",
      views: v.views || 0,
      likes: v.likes || 0,
      // 🔥 Bawa seluruh laci aslinya biar UI tidak pernah kehabisan data
      snippet: v.snippet || {} 
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Failed to fetch YouTube videos:", err);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}