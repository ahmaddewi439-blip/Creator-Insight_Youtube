import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchChannelVideos } from "@/app/lib/youtube/fetchVideos";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        {
          videos: [],
          error:
            "Token Google belum terbaca. Logout lalu login Google lagi dan izinkan akses YouTube.",
        },
        { status: 401 }
      );
    }

    const videos = await fetchChannelVideos(accessToken);

    return NextResponse.json({
      videos,
      count: videos.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        videos: [],
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil video YouTube.",
      },
      { status: 500 }
    );
  }
}