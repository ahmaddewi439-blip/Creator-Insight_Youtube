import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import {
  fetchChannelVideos,
  fetchPublicChannelVideos,
} from "@/app/lib/youtube/fetchVideos";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Ambil session dari NextAuth
    const session = await getServerSession(authOptions);

    // Ambil accessToken jika login via OAuth
    const accessToken = (session as any)?.accessToken as string | undefined;

    let videos;
    if (accessToken) {
      // Jika ada OAuth token, ambil semua video termasuk private/scheduled
      videos = await fetchChannelVideos(accessToken);
    } else {
      // Jika cuma pakai API Key, hanya bisa ambil video publik
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) throw new Error("YOUTUBE_API_KEY belum diisi");
      videos = await fetchPublicChannelVideos(apiKey);
    }

    return NextResponse.json(videos, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch YouTube videos:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to fetch YouTube videos",
      },
      { status: 500 }
    );
  }
}
