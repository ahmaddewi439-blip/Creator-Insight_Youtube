export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId =
      process.env.YOUTUBE_CHANNEL_ID ||
      process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

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

    const url =
      "https://www.googleapis.com/youtube/v3/channels" +
      `?part=snippet,statistics,contentDetails,brandingSettings` +
      `&id=${encodeURIComponent(channelId)}` +
      `&key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data?.error?.message || "Gagal mengambil data channel YouTube." },
        { status: res.status }
      );
    }

    const channel = data?.items?.[0];

    if (!channel) {
      return Response.json(
        { error: "Channel tidak ditemukan. Cek kembali YOUTUBE_CHANNEL_ID." },
        { status: 404 }
      );
    }

    return Response.json({ channel });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Terjadi error saat mengambil channel." },
      { status: 500 }
    );
  }
}