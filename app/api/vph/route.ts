import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    // Mengambil API Key dari Environment Variables Vercel Anda
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!query) {
      return NextResponse.json({ error: 'Kata kunci tidak boleh kosong' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key YouTube belum dikonfigurasi' }, { status: 500 });
    }

    // 1. Mencari video berdasarkan kata kunci yang Anda ketik
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&order=relevance&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
       return NextResponse.json({ success: true, result: [] });
    }

    // Mengumpulkan ID dari video-video yang ditemukan
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

    // 2. Mengambil data statistik (views, likes) dari video-video tersebut
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();

    // 3. Rumus Kalkulasi VPH (Views Per Hour)
    const results = statsData.items.map((item: any) => {
      const publishedAt = new Date(item.snippet.publishedAt);
      const now = new Date();
      
      // Menghitung umur video dalam satuan jam
      const hoursDiff = Math.max((now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60), 1); 
      
      const views = parseInt(item.statistics.viewCount || '0', 10);
      
      // Rumus VPH Asli
      const vph = Math.round(views / hoursDiff);

      // Fungsi untuk mengubah angka ribuan/jutaan jadi huruf (150.000 -> 150K)
      const formatCompact = (num: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(num);

      return {
        title: item.snippet.title,
        vph: formatCompact(vph),
        views: formatCompact(views),
        rawVph: vph // Disimpan untuk keperluan pengurutan
      };
    });

    // 4. Urutkan hasil dari VPH yang paling tinggi (Top Performers)
    results.sort((a: any, b: any) => b.rawVph - a.rawVph);

    return NextResponse.json({ success: true, result: results });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}