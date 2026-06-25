import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // 1. Ambil "Kunci" (Access Token) dari sesi login Mas Ahmad
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = token?.accessToken;

    // Kalau kuncinya tidak ada, tolak aksesnya
    if (!accessToken) {
      return NextResponse.json({ error: "Akses ditolak. Token tidak ditemukan." }, { status: 401 });
    }

    // 2. Ketuk pintu server YouTube sambil menyerahkan "Kunci" (Bearer)
    const ytRes = await fetch(
      "https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store" // Wajib agar data angka tidak nyangkut (selalu real-time)
      }
    );

    // Kalau YouTube marah/error
    if (!ytRes.ok) {
      const errText = await ytRes.text();
      console.error("YouTube API Error:", errText);
      throw new Error(`Gagal akses YouTube: ${ytRes.status}`);
    }

    const data = await ytRes.json();

    // 3. Kirim datanya ke Dashboard web Mas Ahmad!
    if (data.items && data.items.length > 0) {
      return NextResponse.json({ channel: data.items[0] });
    } else {
      return NextResponse.json({ error: "Channel tidak ditemukan." }, { status: 404 });
    }

  } catch (error) {
    console.error("YouTube channel error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil data." },
      { status: 500 }
    );
  }
}