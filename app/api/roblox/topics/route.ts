import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

<<<<<<< HEAD
type TopicMetrics = {
  views: number;
  replies: number;
  likes: number;
  posts: number;
};

type RobloxTopic = {
  id: string;
  title: string;
  source: string;
  link: string;
  url: string;
  date: string;
  summary: string;
  viralScore: number;
  score: number;
  scoreLabel: string;
  confidence: "high" | "medium" | "low";
  whyTrending: string;
  potentialViews: string;
  shortsFit: string;
  gameplayDirection: string;
  metrics: TopicMetrics;
  topicScore: {
    totalOutOf50: number;
    category: string;
    trendRelevance: number;
    visualizability: number;
    engagementPotential: number;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function cleanText(value: string) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function safeNumber(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function daysSince(dateValue: string) {
  if (!dateValue) return 999;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 999;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function recencyPoint(dateValue: string) {
  const days = daysSince(dateValue);

  if (days <= 1) return 20;
  if (days <= 3) return 18;
  if (days <= 7) return 15;
  if (days <= 14) return 11;
  if (days <= 30) return 7;
  return 3;
}

function visualPoint(title: string, summary: string) {
  const text = `${title} ${summary}`.toLowerCase();

  const keywords = [
    "avatar",
    "item",
    "limited",
    "free",
    "event",
    "marketplace",
    "game",
    "experience",
    "studio",
    "creator",
    "performance",
    "compute",
    "chat",
    "safety",
    "update",
    "release",
    "feature",
  ];

  const hit = keywords.filter((keyword) => text.includes(keyword)).length;

  return clamp(8 + hit * 2, 8, 20);
}

function engagementPoint(metrics: TopicMetrics) {
  const views = safeNumber(metrics.views);
  const replies = safeNumber(metrics.replies);
  const likes = safeNumber(metrics.likes);
  const posts = safeNumber(metrics.posts);

  const raw =
    Math.log10(Math.max(views, 1)) * 7 +
    Math.log10(Math.max(replies + 1, 1)) * 8 +
    Math.log10(Math.max(likes + 1, 1)) * 7 +
    Math.log10(Math.max(posts + 1, 1)) * 4;

  return clamp(Math.round(raw), 8, 30);
}

function buildScore(params: {
  title: string;
  summary: string;
  date: string;
  metrics: TopicMetrics;
  source: string;
}) {
  const sourcePoint = 20;
  const recency = recencyPoint(params.date);
  const visual = visualPoint(params.title, params.summary);
  const engagement = engagementPoint(params.metrics);

  const total100 = clamp(sourcePoint + recency + visual + engagement, 1, 100);

  const trendRelevance = clamp(Math.round((recency + engagement) / 5), 1, 10);
  const visualizability = clamp(Math.round(visual / 2), 1, 10);
  const engagementPotential = clamp(Math.round(engagement / 3), 1, 10);
  const totalOutOf50 = clamp(
    trendRelevance + visualizability + engagementPotential + 15,
    1,
    50
  );

  const category =
    totalOutOf50 >= 40
      ? "Very Suitable"
      : totalOutOf50 >= 30
        ? "Suitable"
        : totalOutOf50 >= 20
          ? "Reconsider"
          : "Replace";

  return {
    total100,
    totalOutOf50,
    trendRelevance,
    visualizability,
    engagementPotential,
    category,
  };
}

function buildTopic(input: {
  id: string;
  title: string;
  source: string;
  link: string;
  date: string;
  summary: string;
  metrics: TopicMetrics;
}): RobloxTopic {
  const title = cleanText(input.title);
  const summary = cleanText(input.summary);
  const score = buildScore({
    title,
    summary,
    date: input.date,
    metrics: input.metrics,
    source: input.source,
  });

  const hasMetrics =
    input.metrics.views > 0 ||
    input.metrics.replies > 0 ||
    input.metrics.likes > 0 ||
    input.metrics.posts > 0;

  const whyTrending = hasMetrics
    ? `Topik ini punya sinyal aktual dari sumber resmi: ${input.metrics.views.toLocaleString(
        "en"
      )} views, ${input.metrics.replies.toLocaleString(
        "en"
      )} replies, dan ${input.metrics.likes.toLocaleString("en")} likes.`
    : "Topik ini berasal dari sumber resmi Roblox, tetapi engagement publik dari sumber ini terbatas.";

  const potentialViews =
    score.total100 >= 80
      ? "Potensi tinggi untuk Shorts karena sumber resmi, aktual, dan mudah dibuat hook."
      : score.total100 >= 65
        ? "Potensi sedang-tinggi. Cocok jika dibuka dengan hook kuat dan gameplay jelas."
        : "Potensi sedang. Perlu angle yang lebih tajam agar menarik.";

  const shortsFit =
    score.visualizability >= 7
      ? "Cocok untuk Shorts karena bisa divisualkan dengan gameplay, teks animasi, dan source screenshot."
      : "Bisa dijadikan Shorts, tetapi butuh visual gameplay pendukung agar tidak terasa seperti slide berita.";

  const gameplayDirection =
    /compute|performance|server|scale/i.test(`${title} ${summary}`)
      ? "Gameplay cocok: tampilkan avatar/gameplay yang terasa lag, lalu transisi ke visual game yang lebih smooth sebagai before-after."
      : /avatar|item|marketplace|limited|free/i.test(`${title} ${summary}`)
        ? "Gameplay cocok: avatar showcase, marketplace, inventory, item preview, atau event lobby."
        : /studio|creator|developer|debug|logging/i.test(`${title} ${summary}`)
          ? "Gameplay cocok: gunakan footage Roblox Studio, creator dashboard, atau gameplay testing dengan overlay penjelasan."
          : "Gameplay cocok: gunakan gameplay Roblox relevan sebagai background, source screenshot, dan pop-up teks singkat.";

  return {
    id: input.id,
    title,
    source: input.source,
    link: input.link,
    url: input.link,
    date: input.date,
    summary,
    viralScore: score.total100,
    score: score.total100,
    scoreLabel: `${score.total100}/100`,
    confidence: hasMetrics ? "high" : "medium",
    whyTrending,
    potentialViews,
    shortsFit,
    gameplayDirection,
    metrics: input.metrics,
    topicScore: {
      totalOutOf50: score.totalOutOf50,
      category: score.category,
      trendRelevance: score.trendRelevance,
      visualizability: score.visualizability,
      engagementPotential: score.engagementPotential,
    },
  };
}

async function fetchDevForumTopics(): Promise<RobloxTopic[]> {
=======
function normalizeTopic(topic: any, index: number) {
  const score =
    typeof topic?.score === "number"
      ? topic.score
      : typeof topic?.topicScore === "number"
      ? topic.topicScore
      : null;

  return {
    id: topic?.id || `topic-${index + 1}`,
    title: topic?.title || `Roblox Official Update ${index + 1}`,
    source: topic?.source || "Roblox Official",
    link: topic?.link || topic?.url || "",
    url: topic?.url || topic?.link || "",
    date: topic?.date || topic?.publishedAt || "",
    summary:
      topic?.summary ||
      "Update resmi Roblox dari Newsroom, DevForum, atau akun official.",
    score,
    scoreLabel:
      topic?.scoreLabel ||
      (typeof score === "number" ? `${score}/100` : "Data belum cukup"),
    confidence: topic?.confidence || "low",
    whyTrending: topic?.whyTrending || topic?.trendReason || 
      "Topik ini berasal dari sumber resmi Roblox.",
  };
}

export async function GET(req: Request) {
  // nanti akan berisi panggilan API fetch topic Roblox
}
async function getTopics(req: Request) {
  try {
    // ambil data topic Roblox dari API resmi
    const topicsResponse = await fetch("https://api.roblox.com/official/topics");
    const topics = await topicsResponse.json();
    return topics;
  } catch (error: any) {
    console.error("Gagal mengambil topic Roblox:", error.message);
    return [];
  }
}

export async function POST(req: Request) {
>>>>>>> e2f0c8b (Fix Roblox search update button topics route)
  try {
    const res = await fetch(
      "https://devforum.roblox.com/c/updates/announcements/36/l/latest.json",
      { cache: "no-store" }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const rawTopics = data?.topic_list?.topics;

    if (!Array.isArray(rawTopics)) return [];

    return rawTopics.slice(0, 8).map((topic: any) => {
      const id = String(topic?.id || crypto.randomUUID());
      const slug = String(topic?.slug || "topic");
      const date = String(topic?.last_posted_at || topic?.created_at || "");

      return buildTopic({
        id: `devforum-${id}`,
        title: topic?.title || "Roblox DevForum Update",
        source: "Roblox DevForum",
        link: `https://devforum.roblox.com/t/${slug}/${id}`,
        date,
        summary:
          "Update resmi dari Roblox DevForum Announcements untuk creator, Studio, platform, atau fitur Roblox.",
        metrics: {
          views: safeNumber(topic?.views),
          replies: safeNumber(topic?.reply_count),
          likes: safeNumber(topic?.like_count),
          posts: safeNumber(topic?.posts_count),
        },
      });
    });
  } catch {
    return [];
  }
}

async function fetchNewsroomTopics(): Promise<RobloxTopic[]> {
  try {
    const res = await fetch("https://about.roblox.com/newsroom", {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const html = await res.text();

    const articleMatches = [
      ...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi),
    ];

    const topics: RobloxTopic[] = [];
    const seen = new Set<string>();

    for (const match of articleMatches) {
      const hrefRaw = String(match[1] || "");
      const title = cleanText(String(match[2] || ""));

      if (title.length < 18) continue;
      if (/privacy|terms|careers|investor|contact|learn more|read more/i.test(title)) {
        continue;
      }

      const href = hrefRaw.startsWith("http")
        ? hrefRaw
        : `https://about.roblox.com${hrefRaw.startsWith("/") ? "" : "/"}${hrefRaw}`;

      if (!href.includes("roblox.com")) continue;

      const key = title.toLowerCase();

      if (seen.has(key)) continue;
      seen.add(key);

      topics.push(
        buildTopic({
          id: `newsroom-${topics.length + 1}`,
          title,
          source: "Roblox Newsroom",
          link: href,
          date: "",
          summary:
            "Berita resmi dari Roblox Newsroom. Engagement publik tidak selalu tersedia, sehingga score memakai official source, recency terbatas, dan visual fit.",
          metrics: {
            views: 0,
            replies: 0,
            likes: 0,
            posts: 1,
          },
        })
      );

      if (topics.length >= 4) break;
    }

    return topics;
  } catch {
    return [];
  }
}

async function fetchXTopics(): Promise<RobloxTopic[]> {
  const token = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;

  if (!token) return [];

  try {
    const userRes = await fetch(
      "https://api.twitter.com/2/users/by/username/Roblox?user.fields=id,name,username",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!userRes.ok) return [];

    const userData = await userRes.json();
    const userId = userData?.data?.id;

    if (!userId) return [];

    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at,public_metrics&exclude=retweets,replies`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!tweetsRes.ok) return [];

    const tweetsData = await tweetsRes.json();
    const tweets = Array.isArray(tweetsData?.data) ? tweetsData.data : [];

    return tweets.map((tweet: any) => {
      const metrics = tweet?.public_metrics || {};

      return buildTopic({
        id: `x-${tweet?.id}`,
        title: cleanText(tweet?.text || "Roblox Official X Update").slice(0, 110),
        source: "Roblox Official X",
        link: `https://x.com/Roblox/status/${tweet?.id}`,
        date: String(tweet?.created_at || ""),
        summary:
          "Update dari akun X official Roblox. Score memakai public metrics X jika token tersedia.",
        metrics: {
          views: safeNumber(metrics?.impression_count),
          replies: safeNumber(metrics?.reply_count),
          likes: safeNumber(metrics?.like_count),
          posts: 1,
        },
      });
    });
  } catch {
    return [];
  }
}

async function getTopics() {
  const [devforum, newsroom, xTopics] = await Promise.all([
    fetchDevForumTopics(),
    fetchNewsroomTopics(),
    fetchXTopics(),
  ]);

  const merged = [...devforum, ...newsroom, ...xTopics];

  const seen = new Set<string>();

  return merged
    .filter((topic) => {
      const key = topic.title.toLowerCase();

      if (seen.has(key)) return false;
      seen.add(key);

      return true;
    })
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 6);
}

async function response() {
  try {
    const topics = await getTopics();

    const normalizedTopics = topics.map((topic, index) =>
      normalizeTopic(topic, index)
    );

    return NextResponse.json({
      success: true,
<<<<<<< HEAD
      total: topics.length,
      sourcePolicy:
        "Official Roblox sources only: DevForum Announcements, Roblox Newsroom, and Roblox Official X if token is available.",
      topics,
=======
      total: normalizedTopics.length,
      topics: normalizedTopics,
      message: "Data topics berhasil diambil dari Roblox official sources.",
>>>>>>> e2f0c8b (Fix Roblox search update button topics route)
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, topics: [] },
      { status: 500 }
    );
  }
}

<<<<<<< HEAD
export async function GET() {
  return response();
}

export async function POST() {
  return response();
}
=======
// helper tambahan untuk scoring
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function num(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}
function getTopicScore100(topic: AnyTopic) {
  const direct = typeof topic?.viralScore === "number" ? topic.viralScore : null;
  const score = typeof topic?.score === "number" ? topic.score : null;

  if (direct !== null) return clamp(Math.round(direct), 1, 100);
  if (score !== null) return clamp(Math.round(score), 1, 100);

  // fallback jika tidak ada nilai resmi
  return 50;
}

function hasKeyword(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function prepareGeminiPrompts(topic: AnyTopic) {
  // prompt 1: visual utama Roblox Shorts
  const prompt1 = `Screenshot of Roblox newsroom or game page for topic "${topic.title}", vertical 9:16, scene-specific, no logo, no watermark, readable text`;

  // prompt 2: visual tambahan avatar atau gameplay
  const prompt2 = `Roblox avatar or gameplay related to "${topic.title}", vertical 9:16, scene-specific, practical gameplay visualization, no logo, no watermark`;

  return [prompt1, prompt2];
}

function enrichTopicForShorts(topic: AnyTopic) {
  const score100 = getTopicScore100(topic);
  const trend = topic?.metrics?.views ? Math.min(Math.floor(Math.log10(topic.metrics.views || 1) * 10), 10) : 5;
  const engagement = topic?.metrics ? Math.min(Math.floor(Math.log10((topic.metrics.likes || 0) + 1) * 10), 10) : 5;
  const visual = topic?.metrics ? Math.min(Math.floor(Math.log10((topic.metrics.replies || 0) + 1) * 10), 10) : 5;

  const [prompt1, prompt2] = prepareGeminiPrompts(topic);

  return {
    ...topic,
    score100,
    trend,
    engagement,
    visual,
    geminiPrompts: [prompt1, prompt2],
  };
}
export async function generateShortsResponse(topic: AnyTopic, language: string, duration: string, style: string) {
  // enrichment topic: scoring, trend, visual, engagement, gemini prompts
  const enrichedTopic = enrichTopicForShorts(topic);

  // struktur 5 scene standar Roblox Shorts
  const scenes = [
    {
      scene: 1,
      name: "Strong Hook",
      duration: "0-3s",
      goal: "Stop scrolling immediately with a powerful visual and question.",
      overlayText: `WHAT'S NEW IN ROBLOX?`,
      vo: `Dari sumber resmi Roblox, ada beberapa info penting yang harus kamu tahu hari ini.`,
      imagePrompts: enrichedTopic.geminiPrompts,
      gameplayDirection: "Use gameplay or newsroom visuals; high attention grab.",
      editingDirection: "Smooth zoom and text pop-ups; strong first frame",
      sfx: "Gentle chime or alert sound"
    },
    {
      scene: 2,
      name: "Context / Key Info",
      duration: "3-7s",
      goal: "Introduce main topic clearly",
      overlayText: "ROBLOX UPDATE",
      vo: `Update resmi Roblox dari DevForum dan Newsroom hari ini.`,
      imagePrompts: enrichedTopic.geminiPrompts,
      gameplayDirection: "Show avatar or screenshot highlighting update",
      editingDirection: "Zoom/pan subtly; text for title/date",
      sfx: "Typing or subtle notification sound"
    },
    {
      scene: 3,
      name: "Details / Extra Info",
      duration: "7-25s",
      goal: "Give main fact and key details",
      overlayText: "FEATURES & EVENTS",
      vo: `Beberapa fitur terbaru dan item limited sekarang tersedia.`,
      imagePrompts: enrichedTopic.geminiPrompts,
      gameplayDirection: "Highlight gameplay items or avatars",
      editingDirection: "Subtle zoom & pop-up animations for text",
      sfx: "Soft clicks or game sounds"
    },
    {
      scene: 4,
      name: "Twist / Engagement Hook",
      duration: "25-40s",
      goal: "Add extra surprising fact",
      overlayText: "DID YOU KNOW?",
      vo: `Ada item gratis yang bisa langsung kamu klaim hari ini.`,
      imagePrompts: enrichedTopic.geminiPrompts,
      gameplayDirection: "Show avatar collecting item or feature",
      editingDirection: "Pan and pop animations for emphasis",
      sfx: "Soft chime"
    },
    {
      scene: 5,
      name: "CTA / Engagement",
      duration: "40-60s",
      goal: "Encourage subscribe, comment, and follow",
      overlayText: "FOLLOW FOR MORE",
      vo: `Apa pendapatmu tentang update ini? Jangan lupa follow untuk berita Roblox terbaru!`,
      imagePrompts: enrichedTopic.geminiPrompts,
      gameplayDirection: "Highlight gameplay or topic recap",
      editingDirection: "Zoom on CTA text; animation pop-ups",
      sfx: "Alert or notification sound"
    }
  ];

  return NextResponse.json({
    success: true,
    topicScore: enrichedTopic.score100,
    totalScore: {
      trend: enrichedTopic.trend,
      visual: enrichedTopic.visual,
      engagement: enrichedTopic.engagement,
      total: enrichedTopic.score100
    },
    scenes,
    language,
    durationTarget: duration,
    voStyle: style,
    caption: enrichedTopic.title,
    hashtags: ["#Roblox", "#RobloxUpdate", "#Shorts"],
    pinnedComment: `Update resmi Roblox: ${enrichedTopic.title}`,
    thumbnailTexts: [enrichedTopic.title, "Roblox Shorts"],
    assetChecklist: [],
    finalQualityChecklist: [],
  });
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { language = "en", duration = "60", style = "Natural News" } = body;

    // Ambil topik Roblox terbaru
    const topics = await getTopics(req);

    if (!topics || topics.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Tidak ada topik Roblox terbaru ditemukan."
      }, { status: 404 });
    }

    // Pilih topik pertama sebagai default
    const selectedTopic = normalizeTopic(topics[0], 0);

    // Generate Roblox Shorts JSON lengkap
    const shortsJSON = await generateShortsResponse(selectedTopic, language, duration, style);

    return NextResponse.json(shortsJSON);

  } catch (error: any) {
    console.error("Error generating Roblox Shorts:", error.message);

    return NextResponse.json({
      success: false,
      error: error.message || "Terjadi kesalahan saat memproses request."
    }, { status: 500 });
  }
}

// Optional GET untuk debug / health check
export async function GET(req: Request) {
  return NextResponse.json({ status: "API Roblox Shorts siap", timestamp: new Date() });
}
>>>>>>> e2f0c8b (Fix Roblox search update button topics route)
