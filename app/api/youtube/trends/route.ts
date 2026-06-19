import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "roblox";

  try {
    // Menarik data pencarian REAL-TIME dari server Suggestion YouTube
    const res = await fetch(`http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    
    const keywords = data[1] || []; 
    
    // Mengolah data menjadi format Grafik (Skor didapat dari ranking pencarian terbanyak)
    const chartData = keywords.map((kw: string, index: number) => ({
      keyword: kw,
      score: Math.round(100 - (index * (100 / keywords.length)))
    }));

    return NextResponse.json({ keywords: chartData });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menarik data tren" }, { status: 500 });
  }
}