import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMyVideos } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;
    if (!accessToken) return Response.json({ error: "Belum login YouTube." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const maxResults = Number(searchParams.get("maxResults") || 15);
    const data = await getMyVideos(accessToken, maxResults);
    return Response.json(data);
  } catch (err: any) {
    return Response.json({ error: err?.message || "Gagal mengambil video." }, { status: 500 });
  }
}
