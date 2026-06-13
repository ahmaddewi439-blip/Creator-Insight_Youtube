import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: "Sesi habis." }, { status: 401 });
    }

    const { videoId, title, description, tags } = await req.json();

    // LOGIKA PENCARIAN SUPER: Mengatasi perbedaan format ID
    // Jika videoId berbentuk objek (misal: {videoId: 'xyz'}), kita ambil string-nya
    const cleanId = (typeof videoId === 'object' && videoId?.videoId) ? videoId.videoId : videoId;

    // 1. Ambil data video
    const getRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${cleanId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const getData = await getRes.json();
    const video = getData.items?.[0];

    // Jika video tetap tidak ketemu, kita berikan petunjuk spesifik apa yang salah
    if (!video) {
      throw new Error(`Video ID '${cleanId}' tidak ditemukan. Pastikan akses channel benar.`);
    }

    // 2. Update Video
    const updateRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: cleanId,
        snippet: {
          ...video.snippet,
          title: title,
          description: description,
          tags: tags || video.snippet.tags || [],
          categoryId: video.snippet.categoryId || "20" // Kategori Gaming
        }
      })
    });

    const updateData = await updateRes.json();
    if (!updateRes.ok) throw new Error(updateData.error?.message || "Gagal update ke YouTube");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}