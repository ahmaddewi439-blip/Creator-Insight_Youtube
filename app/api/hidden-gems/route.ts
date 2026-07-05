import { NextResponse } from 'next/server';

// --- MESIN PENERJEMAH SANDI WAKTU YOUTUBE ---
// YouTube mengirim waktu dalam format aneh (ex: "PT1M30S"). Fungsi ini mengubahnya jadi Detik murni.
function parseDuration(duration: string) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  return (hours * 3600) + (minutes * 60) + seconds;
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!query) return NextResponse.json({ error: 'Kata kunci kosong' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'API Key belum dikonfigurasi' }, { status: 500 });

    // 1. Cari video relevan di YouTube
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=15&order=relevance&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
       return NextResponse.json({ success: true, result: [] });
    }

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    
    // Mengumpulkan ID Channel unik untuk mengecek jumlah subscriber-nya
    const channelIdsArray = Array.from(new Set(searchData.items.map((item: any) => item.snippet.channelId)));
    const channelIds = channelIdsArray.join(',');

    // 2. Ambil data statistik Video (Views) DAN Durasi (contentDetails) 👈 INI YANG BARU!
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();

    // 3. Ambil data statistik Channel (Subscribers)
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${apiKey}`;
    const channelRes = await fetch(channelUrl);
    const channelData = await channelRes.json();

    // Menyimpan Subscriber ke dalam memori sementara
    const channelSubsMap: Record<string, number> = {};
    if (channelData.items) {
      channelData.items.forEach((ch: any) => {
        channelSubsMap[ch.id] = parseInt(ch.statistics.subscriberCount || '0', 10);
      });
    }

    const formatCompact = (num: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(num);

    // 4. Kalkulasi Skor Ledakan & Radar Shorts/Long
    const rawResults = searchData.items.map((item: any) => {
      const videoStat = statsData.items?.find((v: any) => v.id === item.id.videoId);
      
      const views = parseInt(videoStat?.statistics?.viewCount || '0', 10);
      const subs = channelSubsMap[item.snippet.channelId] || 0;
      
      // Deteksi Durasi Video Asli
      const durationRaw = videoStat?.contentDetails?.duration || "PT0S";
      const durationSeconds = parseDuration(durationRaw);
      
      // Jika durasi <= 61 detik, cap sebagai Shorts! (61 untuk kompensasi toleransi milidetik YouTube)
      const videoType = durationSeconds <= 61 ? "SHORTS" : "LONG";

      let multiplier = 0;
      if (subs > 0) {
         multiplier = views / subs;
      } else if (views > 0) {
         multiplier = views; 
      }

      return {
        title: item.snippet.title,
        viewsNum: views,
        subsNum: subs,
        views: formatCompact(views),
        subs: formatCompact(subs),
        multiplierNum: multiplier,
        multiplier: `${multiplier.toFixed(1)}x`,
        type: videoType, // 👈 Hasil deteksi radar dikirim ke depan!
        videoId: item.id.videoId // (Bonus) Simpan ID Video untuk tombol buka grafik & tonton video nantinya
      };
    });

    // 5. FILTER RAHASIA: Hanya ambil channel Kecil (<500rb Subs) yang viral (Views minimal 2x lipat subs)
    const gems = rawResults
      .filter((r: any) => r.subsNum < 500000 && r.multiplierNum > 2)
      .sort((a: any, b: any) => b.multiplierNum - a.multiplierNum) 
      .slice(0, 10); 

    return NextResponse.json({ success: true, result: gems });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}