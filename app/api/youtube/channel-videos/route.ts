import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  fetchChannelVideos,
  fetchPublicChannelVideos,
} from "@/app/lib/youtube/fetchVideos";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken as string | undefined;

    if (accessToken) {
      try {
        const oauthVideos = await fetchChannelVideos(accessToken);

        if (oauthVideos.length > 0) {
          return NextResponse.json(oauthVideos, {
            headers: {
              "x-youtube-source": "oauth",
            },
          });
        }
      } catch (error) {
        console.error("OAuth YouTube fetch failed:", error);
      }
    }

    const publicVideos = await fetchPublicChannelVideos();

    return NextResponse.json(publicVideos, {
      headers: {
        "x-youtube-source": "api-key-public",
      },
    });
  } catch (error) {
    console.error("YouTube channel videos error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil video YouTube.",
      },
      { status: 500 }
    );
  }
}
