import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    // 1. Cek Token Akses Login Google Anda
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.accessToken) {
      return NextResponse.json({ error: "Sesi habis. Silakan Logout dan Login kembali." }, { status: 401 });
    }

    // 2. Tangkap data yang dikirim dari tombol Simpan
    const body = await req.json();
    const { videoId, title, description, tags, categoryId } = body;

    if (!videoId || !title) {
      return NextResponse.json({ error: "Video ID dan Judul tidak boleh kosong" }, { status: 400 });
    }

    // 3. Siapkan paket data sesuai format baku Google API
    const snippet = {
      title,
      description,
      tags: tags || [],
      categoryId: categoryId || "20", // 20 adalah kode kategori "Gaming" di YouTube
    };

    // 4. Tembakkan roket instruksi ke Server YouTube Studio
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: videoId,
        snippet,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "YouTube menolak pembaruan data.");
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}