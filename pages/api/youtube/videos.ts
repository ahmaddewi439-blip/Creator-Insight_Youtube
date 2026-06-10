import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { fetchChannelVideos, type VideoItem } from "../../../app/lib/youtube/fetchVideos";

type ApiResponse = VideoItem[] | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const accessToken = (session as any)?.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error:
          "Token Google belum terbaca. Silakan logout, login Google lagi, lalu izinkan akses YouTube.",
      });
    }

    const videos = await fetchChannelVideos(accessToken);

    return res.status(200).json(videos);
  } catch (error) {
    console.error("Failed to fetch YouTube videos:", error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch YouTube videos",
    });
  }
}