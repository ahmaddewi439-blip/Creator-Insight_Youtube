import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "roblox";

  try {
    // JALUR ANTI-BLOKIR: Menggunakan server terbuka YouTube Suggest
    const res = await fetch(`http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    
    const keywords = data[1] || []; 
    
    // 1. Olah data untuk Grafik (Menyesuaikan dengan UI baru Anda)
    const timelineData = keywords.map((kw: string, index: number) => ({
      date: `Rank ${index + 1}`, // Sumbu X grafik
      score: Math.round(100 - (index * (100 / keywords.length))) // Sumbu Y grafik
    }));

    // 2. Olah data untuk Tombol-tombol Keyword di bawah
    const topKeywords = keywords.map((kw: string, index: number) => ({
      keyword: kw,
      score: Math.round(100 - (index * (100 / keywords.length)))
    }));

    // Mengirim 2 data sekaligus agar UI HP Anda tidak error
    return NextResponse.json({ timelineData, topKeywords: topKeywords.slice(0, 15) });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Gagal menarik data tren" }, { status: 500 });
  }
}