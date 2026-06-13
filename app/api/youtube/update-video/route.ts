import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: "Sesi habis, relogin diperlukan." }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, title, description, tags } = body;
    
    // Debugging: Kita cek apakah ID benar-benar terkirim
    console.log("Menerima request update untuk ID:", videoId);

    if (!videoId || videoId === "undefined") {
      throw new Error("ID Video tidak terdeteksi oleh server.");
    }

    // 1. Ambil data video
    const getRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const getData = await getRes.json();
    if (!getData.items || getData.items.length === 0) {
      throw new Error(`Video ID ${videoId} tidak ditemukan di akun Anda.`);
    }

    const video = getData.items[0];

    // 2. Update Video
    const updateRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: videoId,
        snippet: {
          ...video.snippet,
          title: title,
          description: description,
          tags: tags || video.snippet.tags || [],
        }
      })
    });

   const updateData = await updateRes.json();
    
    if (!updateRes.ok) {
      const errMsg = updateData.error?.message || "";
      console.error("YouTube API Error:", updateData);

      // 💡 CONTEKAN VIDIQ: Deteksi spesifik jika izin (scope) kurang / ditolak Google
      if (errMsg.toLowerCase().includes("insufficient") || updateData.error?.code === 403) {
        return NextResponse.json({ 
          error: "Izin YouTube Anda belum lengkap untuk menyimpan data.", 
          code: "REQUIRE_CONSENT" // Kode rahasia agar dibaca oleh frontend
        }, { status: 403 }); // Gunakan status 403 (Forbidden), BUKAN 500
      }

      // Jika error lain (misal video dihapus, dll)
      throw new Error(errMsg || "YouTube API menolak permintaan.");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Server Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}