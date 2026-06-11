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

  if (text.includes("compute") || text.includes("performance") || text.includes("service")) {
    return "performance";
  }

  if (text.includes("debug") || text.includes("logging") || text.includes("studio")) {
    return "developer";
  }

  if (
    text.includes("avatar") ||
    text.includes("item") ||
    text.includes("marketplace") ||
    text.includes("limited") ||
    text.includes("free")
  ) {
    return "avatar-item";
  }

  if (text.includes("event") || text.includes("experience") || text.includes("game")) {
    return "event-game";
  }

  return "official-update";
}

function getScore(topic: Topic) {
  const directScore = toNumber(topic?.viralScore || topic?.score);
  const metrics = topic?.metrics || {};

  const views = toNumber(metrics.views);
  const replies = toNumber(metrics.replies);
  const likes = toNumber(metrics.likes);
  const posts = toNumber(metrics.posts);

  const trendRelevance =
    topic?.topicScore?.trendRelevance ||
    clamp(Math.round(Math.log10(Math.max(views, 1)) * 2.5), 1, 10);

  const visualizability =
    topic?.topicScore?.visualizability ||
    clamp(getTopicType(topic) === "official-update" ? 7 : 9, 1, 10);

  const engagementPotential =
    topic?.topicScore?.engagementPotential ||
    clamp(
      Math.round(
        Math.log10(Math.max(likes + replies + posts + 1, 1)) * 2.5
      ),
      1,
      10
    );

  const totalOutOf50 =
    topic?.topicScore?.totalOutOf50 ||
    clamp(trendRelevance + visualizability + engagementPotential + 15, 1, 50);

  const category =
    topic?.topicScore?.category ||
    (totalOutOf50 >= 40
      ? "Very Suitable"
      : totalOutOf50 >= 30
        ? "Suitable"
        : totalOutOf50 >= 20
          ? "Reconsider"
          : "Replace");

  return {
    sourceTopicScoreOutOf100: directScore || clamp(totalOutOf50 * 2, 1, 100),
    trendRelevance,
    visualizability,
    engagementPotential,
    totalOutOf50,
    category,
    scoringBasis: {
      views,
      replies,
      likes,
      posts,
      source: topic?.source || "Roblox Official",
      note:
        "Score dihitung dari metadata topik yang tersedia: source official, views, replies, likes, posts, recency, dan visual fit. Ini bukan score resmi Roblox.",
    },
  };
}

function getVisualBase(topic: Topic) {
  const type = getTopicType(topic);

  if (type === "performance") {
    return {
      main:
        "a Roblox-inspired blocky game world showing performance improvement, glowing compute/server energy, fast-moving avatar, before-after speed comparison, subtle dashboard elements",
      alt:
        "a Roblox-inspired creator testing a game performance update, server room energy effect, smooth gameplay motion trails, green dark tech atmosphere",
    };
  }

  if (type === "developer") {
    return {
      main:
        "a Roblox-inspired developer workspace with Studio-like panels, structured logging dashboard, debug console visualization, creator avatar analyzing update data",
      alt:
        "a Roblox-inspired game testing scene with debug markers, clean code panels, creator avatar, green neon developer UI, professional update visual",
    };
  }

  if (type === "avatar-item") {
    return {
      main:
        "a Roblox-inspired avatar marketplace scene with item preview cards, blocky avatars, glowing accessory display, clean shop UI, exciting item reveal",
      alt:
        "a Roblox-inspired avatar showcase with limited item display, inventory panel, dramatic reveal lighting, mobile Shorts thumbnail layout",
    };
  }

  if (type === "event-game") {
    return {
      main:
        "a Roblox-inspired event lobby with glowing portal, blocky players gathering, reward display, countdown energy, cinematic game update atmosphere",
      alt:
        "a Roblox-inspired gameplay scene with players reacting to a new event, bright portal, reward icons, dynamic gaming news composition",
    };
  }

  return {
    main:
      "a Roblox-inspired official update scene with blocky avatars reacting to a glowing news panel, gaming news atmosphere, dark green futuristic UI",
    alt:
      "a Roblox-inspired creator news dashboard with update cards, avatar reaction, modern gaming interface, clean mobile Shorts composition",
  };
}

function geminiPrompt(params: {
  topic: Topic;
  sceneNumber: number;
  sceneName: string;
  goal: string;
  overlayText: string;
  variant: 1 | 2;
}) {
  const title = cleanText(params.topic?.title || "Roblox Official Update");
  const source = cleanText(params.topic?.source || "Roblox official source");
  const visual = getVisualBase(params.topic);
  const visualDirection = params.variant === 1 ? visual.main : visual.alt;

  const sceneDirection: Record<number, string> = {
    1: "Scene 1 is a scroll-stopping hook. Use close-up reaction, dramatic lighting, strong curiosity, immediate visual impact.",
    2: "Scene 2 explains the official source. Show source/news context clearly without copying real website branding.",
    3: "Scene 3 explains the main information. Show the feature, update, or impact with simple visual hierarchy.",
    4: "Scene 4 adds a twist or discussion point. Show player reactions, comparison, or surprising impact.",
    5: "Scene 5 is a CTA end screen. Show an avatar pointing to like, comment, and subscribe/follow buttons.",
  };

  return [
    "Gemini image prompt.",
    "Create a vertical 9:16 image for YouTube Shorts.",
    `Topic: "${title}".`,
    `Official source context: ${source}.`,
    `Scene ${params.sceneNumber}: ${params.sceneName}.`,
    `Scene goal: ${params.goal}.`,
    `Overlay text safe space needed for: "${params.overlayText}".`,
    visualDirection,
    sceneDirection[params.sceneNumber],
    "Style: premium dark green gaming news, cinematic lighting, high contrast, sharp focus, mobile-first composition.",
    "Use Roblox-inspired blocky avatars and game environments, but do not include real Roblox logo, real brand logo, watermark, or copyrighted UI.",
    "Do not generate tiny unreadable text. Leave clean empty space for editor overlay text.",
    "Make it suitable as a Shorts visual asset, not a full poster, not horizontal, not cluttered.",
  ].join(" ");
}

function makeScenes(topic: Topic, language: string) {
  const indo = isIndonesian(language);
  const title = cleanText(topic?.title || "Roblox Update");
  const summary = cleanText(
    topic?.summary ||
      "Update resmi Roblox yang penting untuk creator dan player."
  );
  const source = cleanText(topic?.source || "Roblox official source");
  const gameplay =
    topic?.gameplayDirection ||
    "Gunakan gameplay Roblox yang relevan sebagai background, source screenshot, zoom/pan, dan pop-up teks singkat.";

  const scenes = indo
    ? [
        {
          scene: 1,
          name: "Strong Hook",
          duration: "0-3s",
          goal: "Menahan penonton agar tidak scroll dalam 3 detik pertama.",
          overlayText: getTopicType(topic) === "performance"
            ? "GAME ROBLOX KAMU BISA LEBIH KENCANG?"
            : "PLAYER ROBLOX WAJIB TAHU INI!",
          vo:
            getTopicType(topic) === "performance"
              ? "Kalau game Roblox kamu terasa berat, update ini bisa jadi penting banget."
              : `Ada update Roblox resmi yang perlu kamu tahu: ${title}.`,
          gameplayDirection:
            "Rekam 3 detik gameplay cepat: avatar bergerak, zoom mendadak, reaction shot, atau visual yang langsung menunjukkan masalah/topik utama.",
          editingDirection:
            "Fast zoom di detik pertama, teks besar langsung muncul, tambahkan shake ringan dan sound alert.",
          sfx: "whoosh cepat + alert pop",
        },
        {
          scene: 2,
          name: "Official Context",
          duration: "3-12s",
          goal: "Menjelaskan bahwa topik berasal dari sumber resmi.",
          overlayText: "INI DARI SUMBER RESMI",
          vo: `Topik ini berasal dari ${source}, jadi bukan sekadar rumor komunitas.`,
          gameplayDirection:
            "Tampilkan screenshot/screen recording sumber resmi sebagai bukti, lalu transisi ke gameplay Roblox yang relevan.",
          editingDirection:
            "Smooth pan di source visual, highlight judul topik, lalu swipe transition ke gameplay.",
          sfx: "typing halus + smooth whoosh",
        },
        {
          scene: 3,
          name: "Main Information",
          duration: "12-28s",
          goal: "Menyampaikan inti berita/update dengan jelas.",
          overlayText: "INI POIN UTAMANYA",
          vo: `Intinya, ${summary}`,
          gameplayDirection: `${gameplay} Pakai footage 12-16 detik yang paling jelas mendukung poin utama.`,
          editingDirection:
            "Tambahkan 2-3 bullet pop-up, zoom ke objek penting, dan highlight kata kunci.",
          sfx: "soft click + impact ringan",
        },
        {
          scene: 4,
          name: "Extra Twist",
          duration: "28-45s",
          goal: "Meningkatkan rasa penasaran dan komentar.",
          overlayText: "DAMPAKNYA BISA BESAR",
          vo:
            "Yang menarik, update seperti ini bisa memengaruhi cara game Roblox dibuat, dimainkan, atau dipromosikan.",
          gameplayDirection:
            "Gunakan gameplay area ramai, avatar reaction, atau before-after shot. Tambahkan bubble komentar seolah player sedang bereaksi.",
          editingDirection:
            "Split screen, comment bubble, zoom pelan, dan highlight kata kunci.",
          sfx: "riser pendek + pop",
        },
        {
          scene: 5,
          name: "Strong CTA",
          duration: "45-60s",
          goal: "Mengajak like, comment, dan subscribe/follow.",
          overlayText: "MENURUT KAMU BAGUS ATAU TIDAK?",
          vo:
            "Menurut kamu update ini bagus atau justru perlu diubah? Tulis pendapat kamu di komentar, like video ini, dan subscribe biar tidak ketinggalan update Roblox berikutnya.",
          gameplayDirection:
            "Rekam avatar menghadap kamera atau berdiri di lokasi Roblox yang menarik. Tambahkan animasi like, comment, dan subscribe/follow.",
          editingDirection:
            "CTA button animation, smooth zoom out, end screen bersih dengan teks besar.",
          sfx: "button click + success chime",
        },
      ]
    : [
        {
          scene: 1,
          name: "Strong Hook",
          duration: "0-3s",
          goal: "Stop viewers from scrolling in the first 3 seconds.",
          overlayText: getTopicType(topic) === "performance"
            ? "COULD YOUR ROBLOX GAME RUN FASTER?"
            : "ROBLOX PLAYERS NEED TO SEE THIS!",
          vo:
            getTopicType(topic) === "performance"
              ? "If your Roblox game feels heavy, this update could be a big deal."
              : `There is an official Roblox update you should know about: ${title}.`,
          gameplayDirection:
            "Record a fast 3-second gameplay clip: avatar movement, sudden zoom-in, reaction shot, or a visual that instantly shows the main topic.",
          editingDirection:
            "Fast zoom in the first second, big text immediately, light shake, and alert sound.",
          sfx: "fast whoosh + alert pop",
        },
        {
          scene: 2,
          name: "Official Context",
          duration: "3-12s",
          goal: "Explain that the topic comes from an official source.",
          overlayText: "THIS IS FROM AN OFFICIAL SOURCE",
          vo: `This topic comes from ${source}, so it is not just a community rumor.`,
          gameplayDirection:
            "Show a screenshot or screen recording of the official source as proof, then transition into relevant Roblox gameplay.",
          editingDirection:
            "Smooth pan on the source visual, highlight the topic title, then swipe transition into gameplay.",
          sfx: "soft typing + smooth whoosh",
        },
        {
          scene: 3,
          name: "Main Information",
          duration: "12-28s",
          goal: "Deliver the core update clearly.",
          overlayText: "HERE IS THE MAIN POINT",
          vo: `The key point is this: ${summary}`,
          gameplayDirection: `${gameplay} Use a 12-16 second clip that clearly supports the main point.`,
          editingDirection:
            "Add 2-3 pop-up bullets, zoom into the important object, and highlight key words.",
          sfx: "soft click + light impact",
        },
        {
          scene: 4,
          name: "Extra Twist",
          duration: "28-45s",
          goal: "Increase curiosity and comments.",
          overlayText: "THIS COULD MATTER LATER",
          vo:
            "The interesting part is that updates like this can change how Roblox games are built, played, or promoted.",
          gameplayDirection:
            "Use busy gameplay, avatar reaction, or a before-after shot. Add comment bubbles to show player reactions.",
          editingDirection:
            "Split screen, comment bubbles, slow zoom, and keyword highlights.",
          sfx: "short riser + pop",
        },
        {
          scene: 5,
          name: "Strong CTA",
          duration: "45-60s",
          goal: "Drive likes, comments, and subscribe/follow.",
          overlayText: "GOOD UPDATE OR BAD UPDATE?",
          vo:
            "Do you think this update is good, or should Roblox change it? Comment your opinion, like this video, and subscribe so you do not miss the next Roblox update.",
          gameplayDirection:
            "Record your avatar facing the camera or standing in an interesting Roblox location. Add like, comment, and subscribe/follow animations.",
          editingDirection:
            "CTA button animation, smooth zoom out, clean end screen with large text.",
          sfx: "button click + success chime",
        },
      ];

  return scenes.map((scene) => ({
    ...scene,
    imagePrompts: [
      geminiPrompt({
        topic,
        sceneNumber: scene.scene,
        sceneName: scene.name,
        goal: scene.goal,
        overlayText: scene.overlayText,
        variant: 1,
      }),
      geminiPrompt({
        topic,
        sceneNumber: scene.scene,
        sceneName: scene.name,
        goal: scene.goal,
        overlayText: scene.overlayText,
        variant: 2,
      }),
    ],
  }));
}

function buildResult(topic: Topic, language: string, duration: string, style: string) {
  const indo = isIndonesian(language);
  const title = cleanText(topic?.title || "Roblox Update");
  const score = getScore(topic);
  const scenes = makeScenes(topic, language);

  return {
    videoTitle: indo
      ? `${title}: Kenapa Ini Penting?`
      : `${title}: Why This Matters`,
    selectedTopic: topic,
    language,
    durationTarget: duration || "60 seconds",
    style: style || "Natural News",
    topicScore: score,
    realScoringNote:
      "Views, replies, likes, dan posts berasal dari metadata topik. Score adalah analisis internal untuk prediksi potensi Shorts, bukan score resmi Roblox.",
    scenes,
    fullVO: scenes.map((scene) => scene.vo).join(" "),
    gameplayPlan: {
      mainGameplayType:
        topic?.gameplayDirection ||
        "Roblox gameplay support: source screenshot, avatar movement, event/gameplay clip, and CTA shot.",
      recommendedRobloxGamesOrMaps: [
        "relevant Roblox gameplay background",
        "avatar showcase or event lobby",
        "creator testing scene",
        "clean CTA end screen",
      ],
      clipsToRecord: [
        "Scene 1: fast hook clip, 3 seconds",
        "Scene 2: official source screenshot or screen recording, 6-9 seconds",
        "Scene 3: main gameplay explanation clip, 12-16 seconds",
        "Scene 4: reaction or before-after clip, 10-15 seconds",
        "Scene 5: CTA avatar or end screen clip, 5-8 seconds",
      ],
      recordingTips: [
        "Use vertical 9:16 framing.",
        "Keep the avatar or source visual centered.",
        "Use animated text, not long paragraphs.",
        "Put the strongest visual in the first 3 seconds.",
      ],
    },
    caption: indo
      ? `Update Roblox ini penting buat creator dan player. Menurut kamu bagus atau tidak?`
      : `This Roblox update matters for creators and players. Good change or bad change?`,
    description: indo
      ? `Bahas update Roblox terbaru dari sumber resmi dengan hook kuat, gameplay pendukung, dan CTA natural.`
      : `A Roblox official update breakdown with strong hook, supporting gameplay, and natural CTA.`,
    hashtags: [
      "#Roblox",
      "#RobloxUpdate",
      "#RobloxNews",
      "#RobloxShorts",
      "#Gaming",
    ],
    pinnedComment: indo
      ? "Menurut kamu update ini bagus atau tidak? Tulis pendapat kamu di komentar."
      : "Do you think this update is good or bad? Comment your opinion.",
    thumbnailTexts: indo
      ? ["ROBLOX UPDATE BARU!", "PLAYER WAJIB TAHU", "INI DAMPAKNYA"]
      : ["NEW ROBLOX UPDATE!", "PLAYERS NEED THIS", "WHY IT MATTERS"],
    assetChecklist: [
      "Official source screenshot or screen recording",
      "Personal Roblox gameplay footage",
      "Animated text overlay",
      "Like/comment/subscribe animation",
      "SFX: whoosh, pop, chime",
    ],
    finalQualityChecklist: [
      "Scene 1 has a strong 0-3s hook",
      "Each scene has natural VO",
      "Each scene has exactly 2 Gemini-ready image prompts",
      "Gameplay supports the topic, not filler",
      "Scene 5 includes question + comment + like + subscribe/follow CTA",
    ],
  };
}

export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: "/api/roblox/script",
    message:
      "Use POST with { topic, language, duration, style } to generate Roblox Shorts script and Gemini image prompts.",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const topic = body?.topic as Topic | undefined;
    const language = String(body?.language || "Indonesia");
    const duration = String(body?.duration || "60 seconds");
    const style = String(body?.style || "Natural News");

    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          error: "Topik belum dipilih.",
        },
        { status: 400 }
      );
    }

    const result = buildResult(topic, language, duration, style);

    return NextResponse.json({
      success: true,
      enhanced: true,
      result,
      scenes: result.scenes,
      topicScore: result.topicScore,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal generate script Roblox Shorts.",
      },
      { status: 500 }
    );
  }
}
