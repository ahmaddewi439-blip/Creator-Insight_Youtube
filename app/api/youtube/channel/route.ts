import { NextResponse } from "next/server";
import { fetchChannelInfo } from "@/app/lib/youtube/fetchVideos";

export const runtime = "nodejs";

export async function GET() {
  try {
    const channel = await fetchChannelInfo();

    return NextResponse.json(channel);
  } catch (error) {
    console.error("YouTube channel error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data channel YouTube.",
      },
      { status: 500 }
    );
  }
}
