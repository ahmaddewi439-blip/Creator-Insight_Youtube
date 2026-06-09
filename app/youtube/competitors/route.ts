import { searchCompetitorChannels } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return Response.json({ error: "YOUTUBE_API_KEY belum diisi." }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    if (!q.trim()) return Response.json({ channels: [] });

    const channels = await searchCompetitorChannels(q, apiKey, 6);
    return Response.json({ channels });
  } catch (err: any) {
    return Response.json({ error: err?.message || "Gagal mencari kompetitor." }, { status: 500 });
  }
}
