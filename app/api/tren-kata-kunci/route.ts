import { NextResponse } from 'next/server';
import googleTrends from 'google-trends-api';

export async function POST(req: Request) {
  try {
    const { keyword, timeframe } = await req.json();

    // Atur rentang waktu (7 Hari atau 30 Hari ke belakang)
    let startTime = new Date();
    if (timeframe === '7d') {
      startTime.setDate(startTime.getDate() - 7);
    } else {
      startTime.setDate(startTime.getDate() - 30);
    }

    // Eksekusi penarikan data REAL khusus dari YOUTUBE SEARCH
    const results = await googleTrends.interestOverTime({
      keyword: keyword,
      startTime: startTime,
      property: 'youtube' // Kunci utama: Hanya ambil data pencarian YouTube!
    });

    const parsedResults = JSON.parse(results);
    const timelineData = parsedResults.default.timelineData;

    // Rapikan data agar bisa dibaca oleh mesin grafik kita
    const chartData = timelineData.map((item: any) => ({
      name: item.formattedAxisTime,
      skor: item.value[0] // Angka minat penonton real-time (0-100)
    }));

    return NextResponse.json({ success: true, data: chartData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}