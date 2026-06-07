function n(value) {
  return Number(value || 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function avg(values) {
  const arr = (values || []).map(Number).filter((value) => Number.isFinite(value));
  if (!arr.length) return 0;
  return arr.reduce((sum, value) => sum + value, 0) / arr.length;
}

function median(values) {
  const arr = (values || [])
    .map(Number)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (!arr.length) return 0;

  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function daysBetween(a, b) {
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();

  if (!start || !end || Number.isNaN(start) || Number.isNaN(end)) return 0;

  return Math.abs(end - start) / (1000 * 60 * 60 * 24);
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function normalizeArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  return fallback;
}

function pickDate(video) {
  return video.publishAt || video.publishedAt || "";
}

function isPublished(video) {
  return video.ownerStatusKey === "published" || video.privacyStatus === "public";
}

function isScheduledLike(video) {
  return ["scheduled", "private", "unlisted"].includes(video.ownerStatusKey);
}

function scoreTitle(title = "") {
  const text = String(title || "").trim();
  const lower = text.toLowerCase();
  let score = 35;

  if (text.length >= 35 && text.length <= 75) score += 20;
  else if (text.length >= 22 && text.length <= 95) score += 12;
  else score -= 8;

  if (/\d/.test(text)) score += 8;
  if (/[?!]/.test(text)) score += 5;
  if (/(cara|kenapa|rahasia|tips|kesalahan|terbaik|terbaru|viral|update|review|before|after|why|how|secret|mistake|best|worst|rare|hidden|stuck)/i.test(text)) score += 13;
  if (/(part \d+|episode \d+|vlog|random|main-main|coba-coba)/i.test(lower)) score -= 8;
  if (text === text.toUpperCase() && text.length > 18) score -= 5;

  return clamp(Math.round(score), 0, 100);
}

function extractKeywords(videos) {
  const stop = new Set([
    "yang", "dan", "untuk", "dengan", "ini", "itu", "dari", "cara", "bisa", "akan", "atau", "pada", "dalam", "jadi", "lebih", "kamu", "saya", "kami", "tidak", "sudah", "belum", "juga", "youtube", "video", "short", "shorts", "update", "new", "latest", "official", "the", "and", "for", "you", "your", "with", "from", "this", "that", "how", "why", "what", "when", "where", "roblox", "game", "games", "gaming", "minecraft"
  ]);

  const map = new Map();

  (videos || []).forEach((video) => {
    const text = `${video.title || ""} ${(video.tags || []).join(" ")}`
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[^a-z0-9\u00c0-\u024f\u0370-\u03ff\u0400-\u04ff\u4e00-\u9fff\s]/gi, " ");

    text.split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 3 && !stop.has(word))
      .forEach((word) => {
        map.set(word, (map.get(word) || 0) + 1);
      });
  });

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([keyword]) => keyword);
}

function buildManualDiagnosis(payload) {
  const videos = Array.isArray(payload.videos) ? payload.videos.slice(0, 50) : [];
  const publishedVideos = videos
    .filter(isPublished)
    .sort((a, b) => new Date(pickDate(b)).getTime() - new Date(pickDate(a)).getTime());

  const activeVideos = publishedVideos.length ? publishedVideos : videos;
  const views = activeVideos.map((video) => n(video.viewCount));
  const averageViews = Math.round(avg(views));
  const medianViews = Math.round(median(views));

  const recent = activeVideos.slice(0, 5);
  const previous = activeVideos.slice(5, 10);
  const recentAvg = avg(recent.map((video) => n(video.viewCount)));
  const previousAvg = avg(previous.map((video) => n(video.viewCount)));
  const growthPercentage = previousAvg > 0
    ? ((recentAvg - previousAvg) / previousAvg) * 100
    : 0;

  const totalViews = views.reduce((sum, value) => sum + value, 0);
  const totalLikes = activeVideos.reduce((sum, video) => sum + n(video.likeCount), 0);
  const totalComments = activeVideos.reduce((sum, video) => sum + n(video.commentCount), 0);
  const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

  const ascByDate = [...publishedVideos]
    .filter((video) => video.publishedAt)
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());

  const gaps = [];
  for (let i = 1; i < ascByDate.length; i += 1) {
    const gap = daysBetween(ascByDate[i - 1].publishedAt, ascByDate[i].publishedAt);
    if (gap > 0) gaps.push(gap);
  }

  const avgUploadGapDays = round(avg(gaps), 1);
  const bestVideo = [...activeVideos].sort((a, b) => n(b.viewCount) - n(a.viewCount))[0] || null;
  const weakVideo = [...activeVideos].sort((a, b) => n(a.viewCount) - n(b.viewCount))[0] || null;
  const outlierCount = activeVideos.filter((video) => medianViews > 0 && n(video.viewCount) >= medianViews * 1.8).length;
  const weakCount = activeVideos.filter((video) => medianViews > 0 && n(video.viewCount) <= medianViews * 0.55).length;
  const titleQualityScore = Math.round(avg(activeVideos.map((video) => scoreTitle(video.title))));

  let growthScore = 55;
  if (growthPercentage > 60) growthScore = 95;
  else if (growthPercentage > 25) growthScore = 85;
  else if (growthPercentage > 5) growthScore = 72;
  else if (growthPercentage > -10) growthScore = 60;
  else if (growthPercentage > -30) growthScore = 45;
  else growthScore = 30;

  let engagementScore = 35;
  if (engagementRate >= 8) engagementScore = 95;
  else if (engagementRate >= 5) engagementScore = 84;
  else if (engagementRate >= 3) engagementScore = 72;
  else if (engagementRate >= 1.5) engagementScore = 55;
  else if (engagementRate >= 0.5) engagementScore = 42;

  let consistencyScore = 45;
  if (publishedVideos.length < 3) consistencyScore = 42;
  else if (avgUploadGapDays <= 2) consistencyScore = 95;
  else if (avgUploadGapDays <= 4) consistencyScore = 84;
  else if (avgUploadGapDays <= 7) consistencyScore = 70;
  else if (avgUploadGapDays <= 14) consistencyScore = 52;
  else consistencyScore = 34;

  const scheduleCount = videos.filter((video) => video.ownerStatusKey === "scheduled").length;
  const privateCount = videos.filter((video) => ["private", "unlisted"].includes(video.ownerStatusKey)).length;
  const scheduleScore = scheduleCount > 0 ? 78 : 50;
  const overallScore = Math.round(avg([
    growthScore,
    engagementScore,
    consistencyScore,
    titleQualityScore,
    scheduleScore,
  ]));

  const causes = [];

  if (activeVideos.length < 5) {
    causes.push("Data video yang terbaca masih sedikit, jadi pola growth belum cukup kuat untuk disimpulkan secara agresif.");
  }

  if (growthPercentage < -20) {
    causes.push("Rata-rata performa video terbaru turun dibanding kelompok video sebelumnya. Ini indikasi topik, hook, atau packaging terbaru belum sekuat sebelumnya.");
  } else if (growthPercentage < 5) {
    causes.push("Trend video terbaru cenderung datar. Channel belum punya format pemenang yang berulang secara konsisten.");
  }

  if (engagementRate < 1.5) {
    causes.push("Engagement rate masih rendah. Penonton mungkin menonton tanpa terdorong untuk like, komentar, atau berinteraksi.");
  }

  if (avgUploadGapDays > 7 || publishedVideos.length < 3) {
    causes.push("Konsistensi upload belum ideal. Algoritma dan audience sulit membaca pola channel jika jeda upload terlalu longgar.");
  }

  if (titleQualityScore < 60) {
    causes.push("Kekuatan judul belum maksimal. Beberapa judul kemungkinan belum cukup spesifik, belum memancing rasa penasaran, atau belum menonjolkan value utama.");
  }

  if (outlierCount > 0) {
    causes.push("Ada video outlier yang performanya jauh lebih tinggi, tetapi format/topiknya belum terlihat dimaksimalkan menjadi seri lanjutan.");
  }

  if (scheduleCount === 0) {
    causes.push("Belum ada cadangan video scheduled yang terbaca. Untuk growth stabil, channel sebaiknya punya pipeline konten beberapa hari ke depan.");
  }

  const keywords = extractKeywords(activeVideos);
  const mainKeyword = keywords[0] || "topik utama channel";
  const bestTitle = bestVideo?.title || "video terbaik";

  const recommendations = [
    bestVideo
      ? `Buat seri lanjutan dari video terbaik: "${bestTitle}" dengan angle baru, bukan copy ulang.`
      : "Tentukan satu format konten utama untuk dites selama 7 hari.",
    `Gunakan keyword/topik yang sering muncul dan relevan seperti "${mainKeyword}" sebagai bahan judul dan deskripsi video berikutnya.`,
    "Perkuat 3 detik pertama video dengan pertanyaan, konflik, fakta unik, atau hasil akhir yang membuat penonton penasaran.",
    "Buat thumbnail dengan satu fokus visual, kontras jelas, dan teks pendek maksimal 2-4 kata.",
    "Tambahkan pertanyaan natural di akhir video agar komentar meningkat, lalu jadikan komentar itu bahan ide konten berikutnya.",
  ];

  if (avgUploadGapDays > 7) {
    recommendations.unshift("Buat jadwal upload tetap minimal 3x seminggu agar channel punya ritme yang mudah dibaca audience.");
  }

  const actionPlan = [
    `Hari 1: Bongkar video terbaik "${bestTitle}". Catat hook, topik, durasi, gaya judul, dan thumbnail.`,
    `Hari 2: Buat 5 variasi judul dari keyword "${mainKeyword}" dengan format rasa penasaran.`,
    "Hari 3: Siapkan 2 konsep thumbnail untuk satu video baru dan pilih yang paling mudah dipahami dalam 1 detik.",
    "Hari 4: Produksi video baru dengan format mirip video pemenang, tetapi angle dan informasi dibuat baru.",
    "Hari 5: Jadwalkan minimal 1 video berikutnya agar pipeline konten tidak kosong.",
    "Hari 6: Review performa 24 jam pertama dari video terbaru: view, like, komentar, dan judul. Jangan buru-buru ganti format sebelum ada data.",
    "Hari 7: Putuskan 1 format yang dilanjutkan, 1 format yang diperbaiki, dan 1 format yang dihentikan.",
  ];

  const contentIdeas = [
    `Kenapa ${mainKeyword} Bisa Bikin Channel Lebih Cepat Naik?`,
    `5 Kesalahan ${mainKeyword} yang Sering Bikin Video Sepi`,
    `Saya Coba Format ${mainKeyword} Ini, Hasilnya Mengejutkan`,
    `Fakta ${mainKeyword} yang Jarang Dibahas Creator Lain`,
    `Sebelum Upload Video ${mainKeyword}, Cek Ini Dulu`,
    `Update Terbaru ${mainKeyword} yang Bisa Jadi Peluang Konten`,
  ];
  const titleBank = [
    `Kenapa ${mainKeyword} Bisa Lebih Menarik dari yang Orang Kira`,
    `Saya Bongkar Pola Video yang Paling Kuat di Channel Ini`,
    `5 Hal Tentang ${mainKeyword} yang Bisa Jadi Konten Viral`,
    `Video Ini Sepi? Coba Ubah Angle-nya Jadi Begini`,
    `Format ${mainKeyword} Ini Bisa Dipakai 7 Hari Berturut-turut`,
    `Jangan Upload Video ${mainKeyword} Sebelum Cek 3 Hal Ini`,
    `Dari Video Terbaik Ini, Kita Bisa Buat Seri Baru`,
    `Strategi ${mainKeyword} yang Cocok untuk Channel Kecil`,
  ];

  const thumbnailBriefs = [
    `Thumbnail 1: satu objek utama besar + ekspresi/konflik visual + teks 2-3 kata tentang ${mainKeyword}.`,
    `Thumbnail 2: before-after performa/topik, pakai panah atau lingkaran kecil pada bagian yang ingin ditonjolkan.`,
    `Thumbnail 3: tampilkan elemen paling mengejutkan dari video terbaik, jangan terlalu banyak teks.`,
    `Thumbnail 4: gunakan angka besar jika judul memakai list, misalnya 5 kesalahan atau 3 rahasia.`,
    `Thumbnail 5: buat kontras jelas antara masalah dan hasil agar mudah dipahami dalam 1 detik.`,
  ];

  const uploadStrategy = [
    avgUploadGapDays > 7
      ? `Upload minimal 3x seminggu selama 14 hari karena rata-rata jeda upload saat ini sekitar ${avgUploadGapDays} hari.`
      : `Pertahankan ritme upload karena rata-rata jeda upload sekitar ${avgUploadGapDays || 0} hari.`,
    scheduleCount > 0
      ? `Review ${scheduleCount} video scheduled sebelum publish: judul, thumbnail, 3 detik awal, dan CTA komentar.`
      : `Siapkan minimal 2 video scheduled agar channel punya cadangan saat sibuk.`,
    bestVideo
      ? `Gunakan video terbaik sebagai blueprint: ${bestVideo.title}. Buat seri lanjutan dengan angle baru.`
      : `Tentukan 1 format unggulan yang dites berulang selama 7-14 hari.`,
    `Setiap upload harus punya satu target jelas: klik dari judul, tahan penonton dari hook, dan komentar dari pertanyaan akhir.`,
  ];

  const repurposePlan = [
    bestVideo ? `Potong ulang video terbaik menjadi 3 Shorts dengan hook berbeda: fakta, konflik, dan pertanyaan.` : `Ambil 1 video paling jelas topiknya untuk dibuat 3 Shorts pendukung.`,
    `Ubah komentar penonton menjadi ide video balasan agar engagement terasa hidup.`,
    `Buat ulang topik yang sama dalam format berbeda: tutorial, fakta cepat, kesalahan umum, dan update terbaru.`,
    `Gunakan judul lama yang weak sebagai bahan A/B idea, bukan langsung dibuang.`,
  ];

  const riskNotes = [
    `Jangan mengambil kesimpulan dari 1 video saja. Pakai pola minimal 5-10 video.`,
    `Tool belum membaca CTR, retention, watch time, demografi, dan traffic source; jadi diagnosis packaging masih berbasis data publik/owner metadata.`,
    `Jika views turun tetapi engagement naik, jangan langsung ganti niche. Periksa dulu kualitas audience dan format seri.`,
    `Jika scheduled video terlalu banyak tetapi belum optimized, jadwal bisa jalan tetapi performa tetap rendah.`,
  ];

  const priorityMatrix = [
    `High impact / quick: ulangi angle dari video terbaik dalam 48 jam.`,
    `High impact / medium: perbaiki 5 judul scheduled/private sebelum publish.`,
    `Medium impact / quick: tambahkan pertanyaan komentar natural di akhir setiap video.`,
    `Medium impact / medium: buat 14 hari content calendar dari 2-3 pilar topik saja.`,
    `Low impact / jangan dulu: redesign semua tampilan channel sebelum format konten terbukti.`,
  ];

  const contentCalendar = Array.from({ length: 14 }, (_, index) => {
    const day = index + 1;
    const idea = contentIdeas[index % contentIdeas.length];
    const type = index % 3 === 0 ? "Main video" : index % 3 === 1 ? "Shorts" : "Community/teaser";
    return {
      day: `Hari ${day}`,
      type,
      title: idea,
      goal: day <= 3 ? "validasi hook" : day <= 7 ? "ulang format pemenang" : "scale topik terbaik",
    };
  });

  const pipelineScore = Math.round(clamp(45 + scheduleCount * 15 + privateCount * 4, 0, 100));


  let diagnosisTitle = "Channel masih bisa naik, tetapi perlu format pemenang yang konsisten";
  let diagnosisText = "Performa channel belum cukup stabil karena beberapa sinyal seperti trend views, engagement, konsistensi upload, atau kekuatan judul masih perlu diperkuat. Fokus utama berikutnya adalah mengulang pola dari video terbaik, memperbaiki packaging judul/thumbnail, dan menyiapkan pipeline konten terjadwal.";

  if (growthPercentage < -20) {
    diagnosisTitle = "Growth sedang melemah di video terbaru";
    diagnosisText = "Video terbaru menunjukkan penurunan dibanding video sebelumnya. Ini biasanya terjadi ketika topik mulai kurang tajam, hook pembuka kurang kuat, atau format yang menang belum diulang dengan strategi yang jelas.";
  } else if (overallScore >= 75) {
    diagnosisTitle = "Fondasi channel cukup kuat, saatnya scale format pemenang";
    diagnosisText = "Data menunjukkan channel punya sinyal yang cukup baik. Fokus berikutnya bukan mengganti arah terlalu sering, melainkan memperbanyak variasi dari topik dan format yang sudah terbukti menang.";
  } else if (publishedVideos.length < 5) {
    diagnosisTitle = "Data channel masih tipis, perlu eksperimen terarah";
    diagnosisText = "Jumlah video published yang terbaca belum cukup banyak untuk membaca pola besar. Gunakan 7 hari ke depan untuk menguji satu format utama secara konsisten agar data growth lebih jelas.";
  }

  const scheduledReview = videos
    .filter(isScheduledLike)
    .slice(0, 6)
    .map((video) => {
      const titleScore = scoreTitle(video.title);
      let advice = "Perkuat judul, thumbnail, dan deskripsi sebelum video publish.";

      if (video.ownerStatusKey === "scheduled") {
        advice = titleScore < 60
          ? "Judul scheduled ini perlu dibuat lebih spesifik dan lebih memancing klik sebelum waktu publish."
          : "Judul scheduled ini cukup aman. Pastikan thumbnail punya satu fokus visual dan CTA komentar sudah disiapkan.";
      }

      if (video.ownerStatusKey === "private") {
        advice = "Video private ini bisa dijadikan cadangan konten. Lengkapi title, deskripsi, tag, dan thumbnail sebelum dijadwalkan.";
      }

      return {
        title: video.title || "Video tanpa judul",
        status: video.ownerStatusLabel || video.ownerStatusKey || "private",
        publishAt: video.publishAt || "",
        titleScore,
        advice,
      };
    });

  const scheduleAdvice = scheduleCount > 0
    ? `Ada ${scheduleCount} video scheduled yang terbaca. Gunakan waktu sebelum publish untuk mengecek ulang judul, thumbnail, deskripsi, dan keyword agar tidak hanya upload otomatis.`
    : "Belum ada video scheduled yang terbaca. Untuk tool pribadi ini, sebaiknya siapkan minimal 2-3 video cadangan agar channel tidak berhenti saat sedang sibuk.";

  return {
    version: "V5.0",
    aiStatus: "manual",
    metrics: {
      analyzedVideos: activeVideos.length,
      publishedVideos: publishedVideos.length,
      averageViews,
      medianViews,
      recentAvgViews: Math.round(recentAvg),
      previousAvgViews: Math.round(previousAvg),
      growthPercentage: round(growthPercentage, 1),
      engagementRate: round(engagementRate, 2),
      avgUploadGapDays,
      outlierCount,
      weakCount,
      overallScore,
      growthScore,
      engagementScore,
      consistencyScore,
      titleQualityScore,
      scheduleScore,
    },
    diagnosis: {
      title: diagnosisTitle,
      text: diagnosisText,
    },
    causes: causes.slice(0, 6),
    recommendations: recommendations.slice(0, 6),
    actionPlan,
    contentIdeas,
    titleBank,
    thumbnailBriefs,
    contentCalendar,
    uploadStrategy,
    repurposePlan,
    riskNotes,
    priorityMatrix,
    pipelineScore,
    scheduleAdvice,
    scheduledReview,
    bestVideo: bestVideo
      ? {
          id: bestVideo.id,
          title: bestVideo.title,
          viewCount: n(bestVideo.viewCount),
          url: bestVideo.url,
        }
      : null,
    weakVideo: weakVideo
      ? {
          id: weakVideo.id,
          title: weakVideo.title,
          viewCount: n(weakVideo.viewCount),
          url: weakVideo.url,
        }
      : null,
    keywords,
  };
}

function extractJsonFromText(text) {
  const raw = String(text || "").trim();

  try {
    return JSON.parse(raw);
  } catch {}

  const match = raw.match(/\{[\s\S]*\}/);

  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function callAi(prompt) {
  const provider = String(process.env.AI_PROVIDER || "").toLowerCase();

  if (provider === "openai_compatible") {
    const apiKey = process.env.AI_API_KEY;
    const baseUrl = (process.env.AI_BASE_URL || "").replace(/\/$/, "");
    const model = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey || !baseUrl) return null;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Kamu adalah AI strategist YouTube. Balas hanya JSON valid, tanpa markdown.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.65,
        max_tokens: 2500,
        response_format: {
          type: "json_object",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || "AI provider gagal membuat diagnosis.");
    }

    return extractJsonFromText(data.choices?.[0]?.message?.content || "");
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!geminiKey) return null;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const gatewayId = process.env.CLOUDFLARE_GATEWAY_ID || "default";
  let url = "";

  if (provider === "cloudflare" && accountId && gatewayId) {
    url = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/google-ai-studio/v1/models/${model}:generateContent`;
  } else {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  }

  const headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": geminiKey,
  };

  if (provider === "cloudflare" && process.env.CLOUDFLARE_API_TOKEN) {
    headers["cf-aig-authorization"] = `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 2500,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini AI gagal membuat diagnosis.");
  }

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n") ||
    "";

  return extractJsonFromText(text);
}

function buildAiPrompt(manual, payload) {
  const videos = (payload.videos || []).slice(0, 30).map((video) => ({
    title: video.title,
    status: video.ownerStatusKey,
    views: n(video.viewCount),
    likes: n(video.likeCount),
    comments: n(video.commentCount),
    publishedAt: video.publishedAt,
    publishAt: video.publishAt,
    duration: video.durationText,
    tags: (video.tags || []).slice(0, 8),
  }));

  return `
Kamu adalah AI strategist untuk creator YouTube pribadi, seperti fitur diagnosis growth vidIQ/TubeBuddy.
Buat diagnosis kenapa channel bisa stuck berdasarkan data video owner berikut.

BATASAN:
- Jangan mengarang data CTR, retention, watch time, revenue, demografi, atau traffic source karena tidak tersedia.
- Gunakan angka dan judul video yang diberikan saja.
- Jawaban harus tajam, praktis, dan spesifik untuk channel ini.
- Bahasa Indonesia.
- Output wajib JSON valid saja, tanpa markdown.

DATA CHANNEL:
${JSON.stringify({ channel: payload.channel, summary: payload.summary }, null, 2)}

HASIL HITUNGAN MANUAL:
${JSON.stringify(manual.metrics, null, 2)}

VIDEO TERBARU:
${JSON.stringify(videos, null, 2)}

FORMAT JSON WAJIB:
{
  "diagnosis": {
    "title": "judul diagnosis singkat",
    "text": "penjelasan 2-4 kalimat yang spesifik"
  },
  "causes": [
    "penyebab utama 1",
    "penyebab utama 2",
    "penyebab utama 3",
    "penyebab utama 4"
  ],
  "recommendations": [
    "rekomendasi cepat 1",
    "rekomendasi cepat 2",
    "rekomendasi cepat 3",
    "rekomendasi cepat 4",
    "rekomendasi cepat 5"
  ],
  "actionPlan": [
    "Hari 1: ...",
    "Hari 2: ...",
    "Hari 3: ...",
    "Hari 4: ...",
    "Hari 5: ...",
    "Hari 6: ...",
    "Hari 7: ..."
  ],
  "contentIdeas": [
    "ide konten 1",
    "ide konten 2",
    "ide konten 3",
    "ide konten 4",
    "ide konten 5",
    "ide konten 6"
  ],
  "titleBank": ["judul siap pakai 1", "judul siap pakai 2"],
  "thumbnailBriefs": ["brief thumbnail 1", "brief thumbnail 2"],
  "uploadStrategy": ["strategi upload 1", "strategi upload 2"],
  "priorityMatrix": ["prioritas 1", "prioritas 2"],
  "repurposePlan": ["repurpose 1", "repurpose 2"],
  "riskNotes": ["catatan risiko 1", "catatan risiko 2"],
  "contentCalendar": [
    {"day":"Hari 1", "type":"Main video", "title":"judul", "goal":"tujuan"}
  ],
  "scheduleAdvice": "saran untuk video scheduled/private",
  "scheduledReview": [
    {
      "title": "judul video scheduled/private",
      "publishAt": "tanggal publish jika ada",
      "status": "scheduled/private/unlisted",
      "advice": "saran spesifik sebelum publish"
    }
  ]
}
  `.trim();
}

function mergeAi(manual, ai) {
  if (!ai) return manual;

  return {
    ...manual,
    aiStatus: "gemini",
    diagnosis: {
      title: ai.diagnosis?.title || manual.diagnosis.title,
      text: ai.diagnosis?.text || manual.diagnosis.text,
    },
    causes: normalizeArray(ai.causes, manual.causes),
    recommendations: normalizeArray(ai.recommendations, manual.recommendations),
    actionPlan: normalizeArray(ai.actionPlan, manual.actionPlan),
    contentIdeas: normalizeArray(ai.contentIdeas, manual.contentIdeas),
    titleBank: normalizeArray(ai.titleBank, manual.titleBank),
    thumbnailBriefs: normalizeArray(ai.thumbnailBriefs, manual.thumbnailBriefs),
    uploadStrategy: normalizeArray(ai.uploadStrategy, manual.uploadStrategy),
    repurposePlan: normalizeArray(ai.repurposePlan, manual.repurposePlan),
    riskNotes: normalizeArray(ai.riskNotes, manual.riskNotes),
    priorityMatrix: normalizeArray(ai.priorityMatrix, manual.priorityMatrix),
    contentCalendar: Array.isArray(ai.contentCalendar) && ai.contentCalendar.length
      ? ai.contentCalendar.slice(0, 14).map((item, index) => ({
          day: String(item.day || `Hari ${index + 1}`),
          type: String(item.type || "Content"),
          title: String(item.title || manual.contentIdeas[index % manual.contentIdeas.length] || "Ide konten"),
          goal: String(item.goal || "validasi performa"),
        }))
      : manual.contentCalendar,
    pipelineScore: manual.pipelineScore,
    scheduleAdvice: String(ai.scheduleAdvice || manual.scheduleAdvice),
    scheduledReview: Array.isArray(ai.scheduledReview) && ai.scheduledReview.length
      ? ai.scheduledReview.slice(0, 6).map((item) => ({
          title: String(item.title || "Video scheduled/private"),
          status: String(item.status || "scheduled/private"),
          publishAt: String(item.publishAt || ""),
          advice: String(item.advice || "Perkuat judul, thumbnail, dan deskripsi sebelum publish."),
        }))
      : manual.scheduledReview,
  };
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method tidak diizinkan." });
    }

    const payload = parseBody(req);
    const videos = Array.isArray(payload.videos) ? payload.videos.slice(0, 50) : [];

    if (!videos.length) {
      return res.status(400).json({
        message: "Daftar video masih kosong. Klik Baca Video Channel Saya terlebih dahulu.",
      });
    }

    const safePayload = {
      channel: payload.channel || {},
      summary: payload.summary || {},
      videos,
    };

    const manual = buildManualDiagnosis(safePayload);

    try {
      const prompt = buildAiPrompt(manual, safePayload);
      const ai = await callAi(prompt);
      const result = mergeAi(manual, ai);
      return res.status(200).json(result);
    } catch (aiError) {
      return res.status(200).json({
        ...manual,
        aiStatus: "manual",
        aiError: aiError.message || "AI gagal, memakai manual smart diagnosis.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Gagal membuat diagnosis channel.",
    });
  }
};
