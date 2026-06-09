import { getPublicChannelVideos } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return Response.json({ error: "YOUTUBE_API_KEY belum diisi." }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId") || "";
    if (!channelId) return Response.json({ error: "channelId wajib diisi." }, { status: 400 });

    const data = await getPublicChannelVideos(channelId, apiKey, 8);
    return Response.json(data);
  } catch (err: any) {
    return Response.json({ error: err?.message || "Gagal mengambil video kompetitor." }, { status: 500 });
  }
}
