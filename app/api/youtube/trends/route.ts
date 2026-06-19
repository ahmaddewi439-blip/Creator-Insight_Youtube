import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "roblox";

  try {
    // Memanggil library Google Trends
    const googleTrends = require("google-trends-api");
    
    // Setting waktu: 30 Hari Terakhir
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    // 1. Tarik Data Grafik Naik-Turun (Interest Over Time)
    const timelineRes = await googleTrends.interestOverTime({
      keyword: query,
      startTime: lastMonth,
      endTime: today,
    });
    const timelineParsed = JSON.parse(timelineRes);
    const timelineData = timelineParsed.default.timelineData.map((item: any) => ({
      date: item.formattedTime, // Tanggal (contoh: 12 Jun)
      score: item.value[0]      // Skor Pencarian (0 - 100)
    }));

    // 2. Tarik Data Kata Kunci Terkait (Related Queries)
    const relatedRes = await googleTrends.relatedQueries({
      keyword: query,
      startTime: lastMonth,
      endTime: today,
    });
    const relatedParsed = JSON.parse(relatedRes);
    let topKeywords = [];
    
    if (relatedParsed.default && relatedParsed.default.rankedList && relatedParsed.default.rankedList[0]) {
       topKeywords = relatedParsed.default.rankedList[0].rankedKeyword.slice(0, 12).map((k: any) => ({
         keyword: k.query,
         score: k.value
       }));
    }

    return NextResponse.json({ timelineData, topKeywords });
  } catch (error) {
    console.error("Google Trends Error:", error);
    return NextResponse.json({ error: "Gagal menarik data Google Trends" }, { status: 500 });
  }
}