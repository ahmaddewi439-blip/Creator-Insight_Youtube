import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    let { query } = await req.json();
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!query) return NextResponse.json({ error: 'Nama channel tidak boleh kosong' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'API Key belum dikonfigurasi' }, { status: 500 });

    // 🔥 PELINDUNG ANTI-HP: Buang spasi gaib di awal/akhir kata yang sering ditambahkan keyboard HP
    query = query.trim(); 

    let channelId = '';
    let channelInfo: any = {};

    // 1. CARI PROFIL CHANNEL (Logika 2 Arah: Pakai Handle atau Nama Biasa)
    if (query.startsWith('@')) {
      const handle = query.substring(1); 
      const handleUrl = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
      const handleRes = await fetch(handleUrl);
      const handleData = await handleRes.json();

      if (!handleData.items || handleData.items.length === 0) {
        return NextResponse.json({ success: false, error: 'Channel dengan handle tersebut tidak ditemukan.' }, { status: 404 });
      }
      
      channelId = handleData.items[0].id;
      channelInfo = {
        title: handleData.items[0].snippet.title,
        thumbnail: handleData.items[0].snippet.thumbnails?.high?.url || handleData.items[0].snippet.thumbnails?.default?.url,
        subs: handleData.items[0].statistics?.subscriberCount || '0',
        handle: handleData.items[0].snippet.customUrl || query
      };
    } else {
      const searchChannelUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=1&key=${apiKey}`;
      const channelRes = await fetch(searchChannelUrl);
      const channelData = await channelRes.json();

      if (!channelData.items || channelData.items.length === 0) {
        return NextResponse.json({ success: false, error: 'Channel tidak ditemukan.' }, { status: 404 });
      }
      
      channelId = channelData.items[0].snippet.channelId;
      channelInfo = {
        title: channelData.items[0].snippet.channelTitle,
        thumbnail: channelData.items[0].snippet.thumbnails?.high?.url || channelData.items[0].snippet.thumbnails?.default?.url,
        subs: 'Cek Detail', 
        handle: query
      };
    }

    // 2. CARI DAFTAR VIDEO (Urutkan dari views terbanyak)
    const searchVideosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=viewCount&type=video&maxResults=10&key=${apiKey}`;
    const videosRes = await fetch(searchVideosUrl);
    const videosData = await videosRes.json();

    if (!videosData.items || videosData.items.length === 0) {
      return NextResponse.json({ success: true, channelInfo, videos: [] });
    }

    const videoIds = videosData.items.map((item: any) => item.id.videoId).join(',');

    // 3. TARIK DATA STATISTIK & JAM UPLOAD ASLI
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();

    const formatCompact = (num: number) => new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(num);

    const videos = statsData.items.map((item: any) => {
      const views = parseInt(item.statistics.viewCount || '0', 10);
      const likes = parseInt(item.statistics.likeCount || '0', 10);
      
      // Konversi Jam Upload YouTube ke Jam WIB
      const dateObj = new Date(item.snippet.publishedAt);
      const exactDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const exactTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

      return {
        title: item.snippet.title,
        views: formatCompact(views),
        likes: formatCompact(likes),
        published: exactDate,
        time: exactTime
      };
    });

    // Kirim Data Lengkap (Profil + Video) ke Layar Depan
    return NextResponse.json({ success: true, channelInfo, videos });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}