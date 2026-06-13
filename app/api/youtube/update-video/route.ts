import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Memanggil pengaturan login Anda

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    // Mengambil gembok akses (Access Token) dari sesi login
    const accessToken = (session as any)?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: "Sesi habis atau token tidak ditemukan. Silakan relogin." }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, title, description, tags } = body;

    // 1. Tarik data lama video terlebih dahulu (YouTube wajib tahu categoryId saat update)
    const getRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const getData = await getRes.json();
    const video = getData.items?.[0];

    if (!video) throw new Error("Video tidak ditemukan di channel ini.");

    // 2. Tembakkan judul dan deskripsi baru ke Server YouTube
    const updateRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: videoId,
        snippet: {
          ...video.snippet, // Pertahankan data lain seperti categoryId
          title: title,
          description: description,
          tags: tags || video.snippet.tags,
        }
      })
    });

    const updateData = await updateRes.json();
    
    if (!updateRes.ok) {
      throw new Error(updateData.error?.message || "Gagal menyimpan ke YouTube");
    }

    return NextResponse.json({ success: true, data: updateData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}