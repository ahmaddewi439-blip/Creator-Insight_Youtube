import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    // 1. Cek Token Akses Login Google
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.accessToken) {
      return NextResponse.json({ error: "Sesi habis. Silakan Logout dan Login kembali." }, { status: 401 });
    }

    // 2. Tangkap data yang dikirim dari tombol Simpan web Mas Ahmad
    const body = await req.json();
    const { videoId, title, description, tags } = body;

    if (!videoId || !title) {
      return NextResponse.json({ error: "Video ID dan Judul tidak boleh kosong" }, { status: 400 });
    }

    // =================================================================
    // TRIK RAHASIA: Ambil data asli (Paket Lengkap) dari YouTube dulu!
    // Supaya Google tidak marah karena ada data yang kurang
    // =================================================================
    const getRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}`, {
      headers: { Authorization: `Bearer ${token.accessToken}` }
    });
    const getData = await getRes.json();

    if (!getData.items || getData.items.length === 0) {
      return NextResponse.json({ error: "Video tidak ditemukan di YouTube" }, { status: 404 });
    }

    const originalSnippet = getData.items[0].snippet;

    // =================================================================
    // TIMPA DATA LAMA DENGAN DATA BARU
    // =================================================================
    originalSnippet.title = title;
    originalSnippet.description = description;

    // Bersihkan Tags (YouTube menolak tag yang masih ada simbol '#')
    let cleanTags: string[] = [];
    if (Array.isArray(tags)) {
      cleanTags = tags.map((t: string) => t.replace(/^#/, '').trim());
    } else if (typeof tags === 'string') {
      cleanTags = tags.split(',').map((t: string) => t.replace(/^#/, '').trim());
    }
    
    // Masukkan tag bersih ke paket
    originalSnippet.tags = cleanTags.filter(Boolean);

    // =================================================================
    // KIRIM BALIK PAKET LENGKAP KE YOUTUBE
    // =================================================================
    const putRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: videoId,
        snippet: originalSnippet // Kirim paket komplit hasil editan
      }),
    });

    const putData = await putRes.json();
    if (!putRes.ok) {
      throw new Error(putData.error?.message || "YouTube menolak pembaruan data.");
    }

    return NextResponse.json({ success: true, data: putData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}