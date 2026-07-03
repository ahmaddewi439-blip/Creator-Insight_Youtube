import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) return NextResponse.json({ error: 'API Key belum dikonfigurasi' }, { status: 500 });

    // Memanggil API YouTube untuk video Paling Populer (mostPopular) 
    // Kategori Musik (10) khusus region Indonesia (ID)
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=ID&videoCategoryId=10&maxResults=10&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ success: true, result: [] });
    }

    const formatCompact = (num: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(num);

    const results = data.items.map((item: any, index: number) => {
      const views = parseInt(item.statistics.viewCount || '0', 10);
      
      // Menambahkan variasi status trend berdasarkan urutan ranking
      let trendStatus = "🔥 Sedang Viral";
      if (index > 2 && index <= 6) trendStatus = "📈 Naik Daun";
      if (index > 6) trendStatus = "🎵 Masuk Chart";

      return {
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        views: formatCompact(views),
        trend: trendStatus
      };
    });

    return NextResponse.json({ success: true, result: results });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}