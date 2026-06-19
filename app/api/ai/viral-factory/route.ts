import { NextResponse } from "next/server";

// SANGAT PENTING: Memberi nafas 60 detik agar Vercel tidak memutus proses AI yang berat
export const maxDuration = 60; 
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Di sinilah nanti otak AI meracik 4 video sekaligus.
    // Untuk tahap ini, kita aktifkan jalurnya agar sukses terhubung ke tombol tanpa error.
    
    // Simulasi delay AI berpikir (bisa dihapus nanti)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.json({ 
      success: true, 
      message: "✅ Viral Pack (4 Video) Berhasil Dibuat oleh AI!" 
    });
  } catch (error) {
    console.error("Viral Factory Error:", error);
    return NextResponse.json({ error: "Gagal memproses AI Viral Pack" }, { status: 500 });
  }
}