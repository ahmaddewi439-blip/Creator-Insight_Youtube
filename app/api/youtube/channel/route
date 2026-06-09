import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMyChannel } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;
    if (!accessToken) return Response.json({ error: "Belum login YouTube." }, { status: 401 });

    const channel = await getMyChannel(accessToken);
    return Response.json({ channel });
  } catch (err: any) {
    return Response.json({ error: err?.message || "Gagal mengambil channel." }, { status: 500 });
  }
}
