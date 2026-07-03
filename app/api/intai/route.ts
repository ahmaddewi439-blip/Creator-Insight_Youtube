import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!query) return NextResponse.json({ error: 'Nama channel tidak boleh kosong' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'API Key belum dikonfigurasi' }, { status: 500 });

    // 1. Cari ID Channel berdasarkan nama atau handle yang diketik
    const searchChannelUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=1&key=${apiKey}`;
    const channelRes = await fetch(searchChannelUrl);
    const channelData = await channelRes.json();

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Channel tidak ditemukan. Coba ketik handle-nya dengan benar (contoh: @NamaChannel)' }, { status: 404 });
    }

    const channelId = channelData.items[0].snippet.channelId;

    // 2. Cari daftar video dari channel tersebut, diurutkan dari views terbanyak (viewCount)
    const searchVideosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=viewCount&type=video&maxResults=10&key=${apiKey}`;
    const videosRes = await fetch(searchVideosUrl);
    const videosData = await videosRes.json();

    if (!videosData.items || videosData.items.length === 0) {
      return NextResponse.json({ success: true, result: [] });
    }

    const videoIds = videosData.items.map((item: any) => item.id.videoId).join(',');

    // 3. Ambil statistik lengkap (Views, Likes) untuk video-video tersebut
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();

    const formatCompact = (num: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(num);

    // Fungsi canggih untuk mengubah tanggal upload menjadi umur (Contoh: "2 Bulan lalu")
    const getAge = (publishedAt: string) => {
      const diff = new Date().getTime() - new Date(publishedAt).getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return "Hari ini";
      if (days < 30) return `${days} Hari lalu`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${months} Bulan lalu`;
      const years = Math.floor(months / 12);
      return `${years} Tahun lalu`;
    };

    const results = statsData.items.map((item: any) => {
      const views = parseInt(item.statistics.viewCount || '0', 10);
      const likes = parseInt(item.statistics.likeCount || '0', 10);

      return {
        title: item.snippet.title,
        views: formatCompact(views),
        likes: formatCompact(likes),
        published: getAge(item.snippet.publishedAt)
      };
    });

    return NextResponse.json({ success: true, result: results });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}