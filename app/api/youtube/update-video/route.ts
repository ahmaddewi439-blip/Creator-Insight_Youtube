import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.accessToken) {
      return NextResponse.json({ error: "Sesi habis. Silakan Logout dan Login kembali." }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, title, description, tags } = body;

    if (!videoId || !title) {
      return NextResponse.json({ error: "Video ID dan Judul tidak boleh kosong" }, { status: 400 });
    }

    // 1. Ambil data asli dari YouTube
    const getRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}`, {
      headers: { Authorization: `Bearer ${token.accessToken}` }
    });
    const getData = await getRes.json();

    if (!getData.items || getData.items.length === 0) {
      return NextResponse.json({ error: "Video tidak ditemukan di YouTube" }, { status: 404 });
    }

    const originalSnippet = getData.items[0].snippet;

    // 2. Timpa Judul dan Deskripsi
    originalSnippet.title = title;
    originalSnippet.description = description;

    // =================================================================
    // 🔥 PISAU PEMOTONG HASHTAG SUPER CERDAS 🔥
    // =================================================================
    let rawTagsString = "";
    // Ubah ke string tunggal apapun format dari frontend
    if (Array.isArray(tags)) {
      rawTagsString = tags.join(" "); 
    } else if (typeof tags === 'string') {
      rawTagsString = tags;
    }

    // Potong teks setiap kali ada Spasi atau Koma (/[\s,]+/)
    // Lalu hapus semua tanda # dan buang elemen yang kosong
    let cleanTags = rawTagsString
      .split(/[\s,]+/) 
      .map((t: string) => t.replace(/#/g, '').trim()) 
      .filter(Boolean); 

    // Masukkan tag yang sudah terpotong rapi ke dalam paket
    originalSnippet.tags = cleanTags;

    // 3. Kirim paket lengkap ke YouTube
    const putRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: videoId,
        snippet: originalSnippet 
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