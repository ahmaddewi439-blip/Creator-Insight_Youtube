import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!query) return NextResponse.json({ error: 'Nama channel tidak boleh kosong' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'API Key belum dikonfigurasi' }, { status: 500 });

    // 1. Cari ID Channel berdasarkan input
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=1&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Channel tidak ditemukan. Pastikan handle-nya benar.' }, { status: 404 });
    }

    const channelId = searchData.items[0].snippet.channelId;

    // 2. Ambil Statistik Channel (Subscribers, Views, Tanggal Dibuat)
    const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();

    if (!statsData.items || statsData.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Data statistik ditutup oleh pemilik channel.' }, { status: 404 });
    }

    const channelInfo = statsData.items[0];
    const title = channelInfo.snippet.title;
    const subs = parseInt(channelInfo.statistics.subscriberCount || '0', 10);
    const totalViews = parseInt(channelInfo.statistics.viewCount || '0', 10);
    const publishedAt = channelInfo.snippet.publishedAt;

    // 3. Rumus Rahasia Kalkulasi Pendapatan
    const formatCompact = (num: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(num);
    const formatCurrency = (num: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);

    // Menghitung umur channel dalam satuan bulan
    const diffTime = Math.abs(new Date().getTime() - new Date(publishedAt).getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)) || 1; // Minimal 1 bulan

    // Mencari rata-rata views bulanan
    const avgMonthlyViews = totalViews / diffMonths;

    // Asumsi RPM YouTube: $0.25 (Niche Murah) sampai $4.00 (Niche Mahal/Keuangan)
    const minMonthly = (avgMonthlyViews / 1000) * 0.25;
    const maxMonthly = (avgMonthlyViews / 1000) * 4.00;

    const minYearly = minMonthly * 12;
    const maxYearly = maxMonthly * 12;

    return NextResponse.json({
      success: true,
      result: {
        channelName: title,
        subs: formatCompact(subs),
        views: formatCompact(totalViews),
        estMonthly: `${formatCurrency(minMonthly)} - ${formatCurrency(maxMonthly)}`,
        estYearly: `${formatCurrency(minYearly)} - ${formatCurrency(maxYearly)}`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}