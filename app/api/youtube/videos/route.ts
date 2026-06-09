export const dynamic = "force-dynamic";

async function getUploadsPlaylistId(channelId: string, apiKey: string) {
  const url =
    "https://www.googleapis.com/youtube/v3/channels" +
    `?part=contentDetails` +
    `&id=${encodeURIComponent(channelId)}` +
    `&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Gagal mengambil uploads playlist.");
  }

  return data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || "";
}

export async function GET(req: Request) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId =
      process.env.YOUTUBE_CHANNEL_ID ||
      process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

    const { searchParams } = new URL(req.url);
    const maxResults = searchParams.get("maxResults") || "15";

    if (!apiKey) {
      return Response.json(
        { error: "YOUTUBE_API_KEY belum diisi di Vercel." },
        { status: 500 }
      );
    }

    if (!channelId) {
      return Response.json(
        { error: "YOUTUBE_CHANNEL_ID belum diisi di Vercel." },
        { status: 500 }
      );
    }

    const uploadsPlaylistId = await getUploadsPlaylistId(channelId, apiKey);

    if (!uploadsPlaylistId) {
      return Response.json({ videos: [] });
    }

    const playlistUrl =
      "https://www.googleapis.com/youtube/v3/playlistItems" +
      `?part=snippet,contentDetails` +
      `&playlistId=${encodeURIComponent(uploadsPlaylistId)}` +
      `&maxResults=${encodeURIComponent(maxResults)}` +
      `&key=${encodeURIComponent(apiKey)}`;

    const playlistRes = await fetch(playlistUrl, { cache: "no-store" });
    const playlistData = await playlistRes.json();

    if (!playlistRes.ok) {
      return Response.json(
        {
          error:
            playlistData?.error?.message ||
            "Gagal mengambil daftar video YouTube.",
        },
        { status: playlistRes.status }
      );
    }

    const videoIds = (playlistData?.items || [])
      .map((item: any) => item?.contentDetails?.videoId)
      .filter(Boolean)
      .join(",");

    if (!videoIds) {
      return Response.json({ videos: [] });
    }

    const videosUrl =
      "https://www.googleapis.com/youtube/v3/videos" +
      `?part=snippet,statistics,contentDetails,status` +
      `&id=${encodeURIComponent(videoIds)}` +
      `&key=${encodeURIComponent(apiKey)}`;

    const videosRes = await fetch(videosUrl, { cache: "no-store" });
    const videosData = await videosRes.json();

    if (!videosRes.ok) {
      return Response.json(
        {
          error:
            videosData?.error?.message ||
            "Gagal mengambil detail video YouTube.",
        },
        { status: videosRes.status }
      );
    }

    return Response.json({
      videos: videosData?.items || [],
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Terjadi error saat mengambil video." },
      { status: 500 }
    );
  }
}