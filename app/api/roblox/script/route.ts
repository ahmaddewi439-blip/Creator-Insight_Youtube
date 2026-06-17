import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Topic = {
  id?: string;
  title?: string;
  source?: string;
  link?: string;
  url?: string;
  date?: string;
  summary?: string;
  viralScore?: number;
  score?: number;
  scoreLabel?: string;
  whyTrending?: string;
  potentialViews?: string;
  shortsFit?: string;
  gameplayDirection?: string;
  metrics?: {
    views?: number;
    replies?: number;
    likes?: number;
    posts?: number;
  };
  topicScore?: {
    totalOutOf50?: number;
    category?: string;
    trendRelevance?: number;
    visualizability?: number;
    engagementPotential?: number;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function isIndonesian(language: string) {
  const value = String(language || "").toLowerCase();
  return value.includes("indo") || value === "id" || value === "indonesia";
}

function cleanText(value: unknown) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTopicText(topic: Topic) {
  return `${topic?.title || ""} ${topic?.summary || ""}`.toLowerCase();
}

function getTopicType(topic: Topic) {
  const text = getTopicText(topic);
  if (text.includes("compute") || text.includes("performance") || text.includes("service")) return "performance";
  if (text.includes("debug") || text.includes("logging") || text.includes("studio")) return "developer";
  if (text.includes("avatar") || text.includes("item") || text.includes("marketplace") || text.includes("limited") || text.includes("free")) return "avatar-item";
  if (text.includes("event") || text.includes("experience") || text.includes("game")) return "event-game";
  return "official-update";
}

function getScore(topic: Topic) {
  const directScore = toNumber(topic?.viralScore || topic?.score);
  const metrics = topic?.metrics || {};
  const views = toNumber(metrics.views);
  const replies = toNumber(metrics.replies);
  const likes = toNumber(metrics.likes);
  const posts = toNumber(metrics.posts);

  const trendRelevance = topic?.topicScore?.trendRelevance || clamp(Math.round(Math.log10(Math.max(views, 1)) * 2.5), 1, 10);
  const visualizability = topic?.topicScore?.visualizability || clamp(getTopicType(topic) === "official-update" ? 7 : 9, 1, 10);
  const engagementPotential = topic?.topicScore?.engagementPotential || clamp(Math.round(Math.log10(Math.max(likes + replies + posts + 1, 1)) * 2.5), 1, 10);
  const totalOutOf50 = topic?.topicScore?.totalOutOf50 || clamp(trendRelevance + visualizability + engagementPotential + 15, 1, 50);

  const category = topic?.topicScore?.category || (totalOutOf50 >= 40 ? "Very Suitable" : totalOutOf50 >= 30 ? "Suitable" : totalOutOf50 >= 20 ? "Reconsider" : "Replace");

  return {
    sourceTopicScoreOutOf100: directScore || clamp(totalOutOf50 * 2, 1, 100),
    trendRelevance,
    visualizability,
    engagementPotential,
    totalOutOf50,
    category,
    scoringBasis: {
      views, replies, likes, posts,
      source: topic?.source || "Roblox Official",
      note: "Score dihitung dari metadata topik yang tersedia. Ini bukan score resmi Roblox.",
    },
  };
}

function getVisualBase(topic: Topic) {
  const type = getTopicType(topic);
  if (type === "performance") {
    return {
      main: "a Roblox-inspired blocky game world showing performance improvement, glowing compute/server energy, fast-moving avatar",
      alt: "a Roblox-inspired creator testing a game performance update, server room energy effect",
    };
  }
  if (type === "avatar-item") {
    return {
      main: "a Roblox-inspired avatar marketplace scene with item preview cards, blocky avatars, glowing accessory display",
      alt: "a Roblox-inspired avatar showcase with limited item display, inventory panel, dramatic reveal lighting",
    };
  }
  return {
    main: "a Roblox-inspired official update scene with blocky avatars reacting to a glowing news panel, gaming news atmosphere",
    alt: "a Roblox-inspired creator news dashboard with update cards, avatar reaction, modern gaming interface",
  };
}

// LOGIKA DINAMIS: Mendukung 9:16 (Shorts) dan 16:9 (Long Video)
function geminiPrompt(params: { topic: Topic; sceneNumber: number; sceneName: string; goal: string; overlayText: string; variant: 1 | 2; isLongVideo: boolean }) {
  const title = cleanText(params.topic?.title || "Roblox Update");
  const visual = getVisualBase(params.topic);
  const visualDirection = params.variant === 1 ? visual.main : visual.alt;

  const ratioFormat = params.isLongVideo ? "horizontal 16:9 image for YouTube Long Form Video" : "vertical 9:16 image for YouTube Shorts";
  const composition = params.isLongVideo ? "desktop-first landscape composition, expansive view" : "mobile-first vertical composition";

  return [
    `Gemini image prompt. Create a ${ratioFormat}.`,
    `Topic: "${title}".`,
    `Scene ${params.sceneNumber}: ${params.sceneName}. Goal: ${params.goal}.`,
    `Overlay text space for: "${params.overlayText}".`,
    visualDirection,
    `Style: premium dark green gaming news, cinematic lighting, high contrast, sharp focus, ${composition}.`,
    "Use Roblox-inspired blocky avatars, but no real logos or copyrighted UI.",
  ].join(" ");
}

// PENAMBAHAN TUGAS: Memisahkan Template Shorts dan Template Long Video
function makeScenes(topic: Topic, language: string, duration: string) {
  const indo = isIndonesian(language);
  const title = cleanText(topic?.title || "Roblox Update");
  const summary = cleanText(topic?.summary || "Detail penting seputar Roblox");
  
  const isLongVideo = duration.toLowerCase().includes("menit") || duration.toLowerCase().includes("minutes");

  let scenes = [];

  if (isLongVideo) {
    // TEMPLATE BARU: UNTUK VIDEO PANJANG (Diambil dari durasi yang dipilih)
    const midPoint = parseInt(duration) / 2;
    scenes = indo ? [
      {
        scene: 1, name: "Intro & Hook", duration: "00:00 - 01:30", goal: "Membangun rasa penasaran ekstrem di awal video.", overlayText: "RAHASIA BESAR TERBONGKAR",
        vo: `Halo semuanya! Hari ini kita akan membahas sesuatu yang sangat gila tentang ${title}. Banyak yang tidak sadar, tapi ada rahasia besar di balik ini. Pastikan kalian tonton sampai habis karena di pertengahan video ada kejutan!`,
        gameplayDirection: "Gunakan cinematic shot dari map Roblox yang relevan, pergerakan lambat, dan efek blur di awal lalu fokus ke karakter.",
        editingDirection: "Cinematic black bars, slow zoom in, text animasi glitch.", sfx: "deep bass boom + drone sound"
      },
      {
        scene: 2, name: "Konteks & Sejarah", duration: "01:30 - 04:00", goal: "Memberikan latar belakang cerita.", overlayText: "AWAL MULANYA...",
        vo: `Sebelum kita masuk ke rahasia utamanya, kita harus tahu dulu dari mana ${summary} ini berasal. Beberapa bulan lalu, komunitas mulai curiga dengan...`,
        gameplayDirection: "Tampilkan screenshot forum/berita lama, lalu gameplay santai sambil menjelaskan kronologi.",
        editingDirection: "Ken Burns effect pada gambar, pop-up text untuk tanggal penting.", sfx: "page turn + soft typing"
      },
      {
        scene: 3, name: "Inti Misteri / Update", duration: `04:00 - ${Math.max(5, midPoint + 1)}:00`, goal: "Pembahasan paling detail.", overlayText: "BUKTI UTAMA",
        vo: `Sekarang mari kita lihat buktinya! Jika kalian perhatikan di bagian ini, ada detail yang sengaja disembunyikan. Ini membuktikan bahwa ${title} bukan sekadar kebetulan.`,
        gameplayDirection: "Gameplay harus sinkron dengan ucapan. Gunakan zoom tajam ke titik misteri/update yang dibahas.",
        editingDirection: "Highlight merah (red circle/arrow), pause frame (freeze), warna dibuat sedikit kontras.", sfx: "camera shutter + dramatic reveal"
      },
      {
        scene: 4, name: "Dampak & Teori", duration: `${Math.max(5, midPoint + 1)}:00 - ${parseInt(duration) - 1}:00`, goal: "Membangun teori konspirasi / masa depan.", overlayText: "APA SELANJUTNYA?",
        vo: `Lalu apa dampaknya buat kita semua? Ada teori yang mengatakan kalau update ini akan mengubah cara kita bermain Roblox selamanya. Bayangkan jika...`,
        gameplayDirection: "Gameplay intens, montage beberapa game populer Roblox yang terdampak.",
        editingDirection: "Split screen perbandingan, transisi cepat.", sfx: "fast swoosh + tension riser"
      },
      {
        scene: 5, name: "Kesimpulan & CTA", duration: `${parseInt(duration) - 1}:00 - ${duration}`, goal: "Mengunci interaksi penonton.", overlayText: "SUBSCRIBE UNTUK INFO LAINNYA",
        vo: `Nah, itu dia pembahasan mendalam kita tentang ${title}. Menurut kalian, apakah ini kebetulan atau disengaja? Tulis opini liar kalian di bawah! Jangan lupa like dan subscribe supaya nggak ketinggalan misteri Roblox lainnya.`,
        gameplayDirection: "Karakter avatar melambai ke kamera, diiringi background gameplay yang epik.",
        editingDirection: "Animasi tombol subscribe membesar, outro music fade in.", sfx: "pop up + chime"
      }
    ] : [
      // Versi English untuk Long Video dihilangkan untuk menghemat ruang, (Sama seperti Indo tapi English)
      {
        scene: 1, name: "Intro & Hook", duration: "00:00 - 01:30", goal: "Extreme curiosity.", overlayText: "BIG SECRET REVEALED",
        vo: `Hey everyone! Today we are diving deep into ${title}. Most people missed this, but there is a massive secret hidden here.`,
        gameplayDirection: "Cinematic shot of relevant Roblox map.", editingDirection: "Slow zoom in.", sfx: "deep bass boom"
      },
      { scene: 2, name: "Context", duration: "01:30 - 04:00", goal: "Background.", overlayText: "HOW IT STARTED", vo: `To understand this, we need to look back at ${summary}.`, gameplayDirection: "Chill gameplay.", editingDirection: "Ken burns.", sfx: "typing" },
      { scene: 3, name: "Main Evidence", duration: "04:00 - 07:00", goal: "Core detail.", overlayText: "THE PROOF", vo: `Look closely at this detail. It proves ${title} is real.`, gameplayDirection: "Zoom into specific area.", editingDirection: "Red circle.", sfx: "reveal" },
      { scene: 4, name: "Impact", duration: "07:00 - 09:00", goal: "Theories.", overlayText: "WHAT IS NEXT?", vo: `What does this mean for the future of Roblox?`, gameplayDirection: "Fast montage.", editingDirection: "Split screen.", sfx: "swoosh" },
      { scene: 5, name: "Outro & CTA", duration: `09:00 - ${duration}`, goal: "Engagement.", overlayText: "SUBSCRIBE!", vo: `What do you think? Comment below, like, and subscribe!`, gameplayDirection: "Avatar waving.", editingDirection: "CTA animation.", sfx: "chime" }
    ];
  } else {
    // TEMPLATE LAMA: UNTUK SHORTS (TIDAK ADA YANG DIHAPUS, TETAP 9:16 dan 0-60s)
    scenes = indo ? [
      { scene: 1, name: "Strong Hook", duration: "0-3s", goal: "Stop scrolling", overlayText: "WAJIB TAHU!", vo: `Ada info penting soal ${title}.`, gameplayDirection: "Gameplay cepat.", editingDirection: "Fast zoom.", sfx: "whoosh" },
      { scene: 2, name: "Context", duration: "3-12s", goal: "Source", overlayText: "SUMBER RESMI", vo: `Ini berasal dari sumber resmi.`, gameplayDirection: "Screenshot", editingDirection: "Smooth pan.", sfx: "typing" },
      { scene: 3, name: "Main Info", duration: "12-28s", goal: "Core info", overlayText: "INTINYA INI", vo: `Intinya: ${summary}.`, gameplayDirection: "Gameplay relevan", editingDirection: "Pop-up text.", sfx: "click" },
      { scene: 4, name: "Twist", duration: "28-45s", goal: "Curiosity", overlayText: "DAMPAKNYA", vo: `Dampaknya sangat besar.`, gameplayDirection: "Avatar reaction", editingDirection: "Split screen.", sfx: "riser" },
      { scene: 5, name: "CTA", duration: "45-60s", goal: "Engagement", overlayText: "SUBSCRIBE!", vo: `Komen di bawah dan subscribe!`, gameplayDirection: "Avatar depan kamera", editingDirection: "CTA animation.", sfx: "chime" },
    ] : [
       { scene: 1, name: "Strong Hook", duration: "0-3s", goal: "Stop scrolling", overlayText: "MUST SEE!", vo: `Important news about ${title}.`, gameplayDirection: "Fast gameplay.", editingDirection: "Fast zoom.", sfx: "whoosh" },
       { scene: 2, name: "Context", duration: "3-12s", goal: "Source", overlayText: "OFFICIAL SOURCE", vo: `This is from official sources.`, gameplayDirection: "Screenshot", editingDirection: "Smooth pan.", sfx: "typing" },
       { scene: 3, name: "Main Info", duration: "12-28s", goal: "Core info", overlayText: "THE POINT", vo: `Basically: ${summary}.`, gameplayDirection: "Relevant gameplay", editingDirection: "Pop-up text.", sfx: "click" },
       { scene: 4, name: "Twist", duration: "28-45s", goal: "Curiosity", overlayText: "THE IMPACT", vo: `This changes everything.`, gameplayDirection: "Avatar reaction", editingDirection: "Split screen.", sfx: "riser" },
       { scene: 5, name: "CTA", duration: "45-60s", goal: "Engagement", overlayText: "SUBSCRIBE!", vo: `Comment and subscribe!`, gameplayDirection: "Avatar facing camera", editingDirection: "CTA animation.", sfx: "chime" },
    ];
  }

  // Generate Image Prompts dinamis berdasarkan jenis video
  return scenes.map((scene) => ({
    ...scene,
    imagePrompts: [
      geminiPrompt({ topic, sceneNumber: scene.scene, sceneName: scene.name, goal: scene.goal, overlayText: scene.overlayText, variant: 1, isLongVideo }),
      geminiPrompt({ topic, sceneNumber: scene.scene, sceneName: scene.name, goal: scene.goal, overlayText: scene.overlayText, variant: 2, isLongVideo }),
    ],
  }));
}

function buildResult(topic: Topic, language: string, duration: string, style: string) {
  const indo = isIndonesian(language);
  const title = cleanText(topic?.title || "Roblox Update");
  const score = getScore(topic);
  const scenes = makeScenes(topic, language, duration);

  return {
    videoTitle: indo ? `${title}: Bahas Tuntas Misteri Ini!` : `${title}: Why This Matters`,
    selectedTopic: topic,
    language,
    durationTarget: duration,
    style: style || "Natural News",
    topicScore: score,
    scenes,
    fullVO: scenes.map((scene) => scene.vo).join(" ")
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // PERBAIKAN KRUSIAL: Menerima String Topik dari Web lalu diubah jadi Object agar AI tidak mereset
    const rawTopic = body?.topic;
    const topicObj: Topic = typeof rawTopic === 'string' ? { title: rawTopic, summary: "Pembaruan penting Roblox" } : (rawTopic as Topic || { title: "Roblox Update" });
    
    const language = String(body?.language || "Indonesia");
    const duration = String(body?.duration || "60 seconds");
    const style = String(body?.style || "Natural News");

    const result = buildResult(topicObj, language, duration, style);

    return NextResponse.json({
      success: true,
      enhanced: true,
      result,
      scenes: result.scenes,
      topicScore: result.topicScore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal generate script." },
      { status: 500 }
    );
  }
}