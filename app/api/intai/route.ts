import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    let { query } = await req.json();
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!query) return NextResponse.json({ error: 'Input tidak boleh kosong' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'API Key belum dikonfigurasi' }, { status: 500 });

    query = query.trim();
    
    // 🔥 INI OBATNYA: Kita beri tahu TypeScript bahwa ini adalah wadah array (any[])
    let channelsToProcess: any[] = []; 

    // 1. CARI CHANNEL(S)
    if (query.startsWith('@')) {
      // Mode Spesifik: Cari 1 Channel lewat Handle
      const handle = query.substring(1);
      const handleUrl = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
      const handleRes = await fetch(handleUrl);
      const handleData = await handleRes.json();

      if (!handleData.items || handleData.items.length === 0) {
        return NextResponse.json({ success: false, error: 'Channel dengan handle tersebut tidak ditemukan.' }, { status: 404 });
      }
      
      channelsToProcess.push({
        id: handleData.items[0].id,
        title: handleData.items[0].snippet.title,
        thumbnail: handleData.items[0].snippet.thumbnails?.high?.url || handleData.items[0].snippet.thumbnails?.default?.url,
        handle: handleData.items[0].snippet.customUrl || query
      });
    } else {
      // Mode Topik: Cari Top 5 Channel Kompetitor berdasarkan Kata Kunci
      const searchChannelUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=5&key=${apiKey}`;
      const channelRes = await fetch(searchChannelUrl);
      const channelData = await channelRes.json();

      if (!channelData.items || channelData.items.length === 0) {
        return NextResponse.json({ success: false, error: 'Tidak ada channel yang ditemukan untuk kata kunci tersebut.' }, { status: 404 });
      }

      channelsToProcess = channelData.items.map((item: any) => ({
        id: item.snippet.channelId,
        title: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        handle: 'Channel Kompetitor'
      }));
    }

    const formatCompact = (num: number) => new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(num);

    // 2. PROSES SEMUA CHANNEL SEKALIGUS UNTUK MENARIK DATA VIDEO MEREKA
    const finalResults = await Promise.all(channelsToProcess.map(async (channel) => {
      // Ambil 5 video terpopuler per channel agar loading tetap cepat
      const searchVideosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&order=viewCount&type=video&maxResults=5&key=${apiKey}`;
      const videosRes = await fetch(searchVideosUrl);
      const videosData = await videosRes.json();

      let videos: any[] = [];
      if (videosData.items && videosData.items.length > 0) {
        const videoIds = videosData.items.map((item: any) => item.id.videoId).join(',');
        
        // Ambil data statistik dan jam asli
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
        const statsRes = await fetch(statsUrl);
        const statsData = await statsRes.json();

        videos = statsData.items.map((item: any) => {
          const views = parseInt(item.statistics.viewCount || '0', 10);
          const likes = parseInt(item.statistics.likeCount || '0', 10);
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
      }

      return {
        channelInfo: channel,
        videos: videos
      };
    }));

    return NextResponse.json({ success: true, results: finalResults });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}