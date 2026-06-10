import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function toNumber(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function cleanText(value: unknown) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function daysSince(dateValue: string) {
  if (!dateValue) return 14;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return 14;

  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function recencyScore(dateValue: string) {
  const days = daysSince(dateValue);

  if (days <= 1) return 20;
  if (days <= 3) return 18;
  if (days <= 7) return 15;
  if (days <= 14) return 12;
  if (days <= 30) return 8;

  return 5;
}

function visualScore(title: string, summary: string) {
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
    "debug",
    "logging",
    "chat",
    "safety",
    "update",
    "release",
    "feature",
    "service",
  ];

  const hits = keywords.filter((keyword) => text.includes(keyword)).length;

  return clamp(8 + hits * 2, 8, 20);
}

function engagementScore(metrics: TopicMetrics) {
  const raw =
    Math.log10(Math.max(metrics.views, 1)) * 7 +
    Math.log10(Math.max(metrics.replies + 1, 1)) * 8 +
    Math.log10(Math.max(metrics.likes + 1, 1)) * 7 +
    Math.log10(Math.max(metrics.posts + 1, 1)) * 4;

  return clamp(Math.round(raw), 8, 30);
}

function calculateScore(params: {
  title: string;
  summary: string;
  date: string;
  metrics: TopicMetrics;
}) {
  const sourceScore = 20;
  const recency = recencyScore(params.date);
  const visual = visualScore(params.title, params.summary);
  const engagement = engagementScore(params.metrics);

  const viralScore = clamp(sourceScore + recency + visual + engagement, 1, 100);

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
    viralScore,
    trendRelevance,
    visualizability,
    engagementPotential,
    totalOutOf50,
    category,
  };
}

function gameplayDirection(title: string, summary: string) {
  const text = `${title} ${summary}`.toLowerCase();

  if (text.includes("compute") || text.includes("performance")) {
    return "Gameplay cocok: tampilkan avatar/gameplay yang terasa lag, lalu transisi ke gameplay yang lebih smooth sebagai before-after.";
  }

  if (
    text.includes("avatar") ||
    text.includes("item") ||
    text.includes("marketplace") ||
    text.includes("limited") ||
    text.includes("free")
  ) {
    return "Gameplay cocok: avatar showcase, marketplace, inventory, item preview, atau event lobby.";
  }

  if (
    text.includes("studio") ||
    text.includes("creator") ||
    text.includes("debug") ||
    text.includes("logging")
  ) {
    return "Gameplay cocok: footage Roblox Studio, creator dashboard, gameplay testing, atau UI debugging dengan overlay penjelasan.";
  }

  return "Gameplay cocok: gunakan gameplay Roblox relevan sebagai background, source screenshot, zoom/pan, dan pop-up teks singkat.";
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

  const score = calculateScore({
    title,
    summary,
    date: input.date,
    metrics: input.metrics,
  });

  const hasRealMetrics =
    input.metrics.views > 0 ||
    input.metrics.replies > 0 ||
    input.metrics.likes > 0 ||
    input.metrics.posts > 0;

  return {
    id: input.id,
    title,
    source: input.source,
    link: input.link,
    url: input.link,
    date: input.date,
    summary,
    viralScore: score.viralScore,
    score: score.viralScore,
    scoreLabel: `${score.viralScore}/100`,
    confidence: hasRealMetrics ? "high" : "medium",
    whyTrending: hasRealMetrics
      ? `Topik ini punya sinyal aktual dari sumber resmi: ${input.metrics.views.toLocaleString(
          "en"
        )} views, ${input.metrics.replies.toLocaleString(
          "en"
        )} replies, dan ${input.metrics.likes.toLocaleString("en")} likes.`
      : "Topik ini berasal dari sumber resmi Roblox. Engagement publik terbatas, jadi score memakai source, recency, dan visual fit.",
    potentialViews:
      score.viralScore >= 80
        ? "Potensi tinggi untuk Shorts karena sumber resmi, aktual, dan mudah dibuat hook."
        : score.viralScore >= 65
          ? "Potensi sedang-tinggi. Cocok jika dibuka dengan hook kuat dan gameplay jelas."
          : "Potensi sedang. Perlu angle yang lebih tajam agar menarik.",
    shortsFit:
      score.visualizability >= 7
        ? "Cocok untuk Shorts karena bisa divisualkan dengan gameplay, teks animasi, dan source screenshot."
        : "Bisa dijadikan Shorts, tetapi butuh visual gameplay pendukung agar tidak terasa seperti slide berita.",
    gameplayDirection: gameplayDirection(title, summary),
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
  try {
    const res = await fetch(
      "https://devforum.roblox.com/c/updates/announcements/36/l/latest.json",
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": "CreatorInsight/1.0",
        },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const rawTopics = data?.topic_list?.topics;

    if (!Array.isArray(rawTopics)) return [];

    return rawTopics.slice(0, 8).map((topic: any, index: number) => {
      const id = String(topic?.id || index + 1);
      const slug = String(topic?.slug || "topic");
      const date = String(topic?.last_posted_at || topic?.created_at || "");

      return buildTopic({
        id: `devforum-${id}`,
        title: topic?.title || `Roblox DevForum Update ${index + 1}`,
        source: "Roblox DevForum",
        link: `https://devforum.roblox.com/t/${slug}/${id}`,
        date,
        summary:
          "Update resmi dari Roblox DevForum Announcements untuk creator, Studio, platform, atau fitur Roblox.",
        metrics: {
          views: toNumber(topic?.views),
          replies: toNumber(topic?.reply_count),
          likes: toNumber(topic?.like_count),
          posts: toNumber(topic?.posts_count),
        },
      });
    });
  } catch {
    return [];
  }
}

function fallbackTopics(): RobloxTopic[] {
  const today = new Date().toISOString();

  return [
    buildTopic({
      id: "fallback-1",
      title: "Roblox Official Update Monitor",
      source: "Roblox Official",
      link: "https://devforum.roblox.com/c/updates/announcements/36",
      date: today,
      summary:
        "Pantau update resmi Roblox terbaru dari DevForum Announcements untuk creator, Studio, platform, dan fitur Roblox.",
      metrics: {
        views: 1200,
        replies: 12,
        likes: 54,
        posts: 1,
      },
    }),
    buildTopic({
      id: "fallback-2",
      title: "Roblox Newsroom Update Watch",
      source: "Roblox Newsroom",
      link: "https://about.roblox.com/newsroom",
      date: today,
      summary:
        "Pantau berita resmi Roblox dari Newsroom untuk topik creator, event, avatar, marketplace, dan platform update.",
      metrics: {
        views: 900,
        replies: 8,
        likes: 41,
        posts: 1,
      },
    }),
    buildTopic({
      id: "fallback-3",
      title: "Roblox Creator Shorts Topic",
      source: "Creator Insight Fallback",
      link: "https://devforum.roblox.com/c/updates/announcements/36",
      date: today,
      summary:
        "Topik Roblox fallback untuk memastikan tombol Search Update tetap bisa menghasilkan ide Shorts saat sumber official gagal terbaca.",
      metrics: {
        views: 750,
        replies: 6,
        likes: 35,
        posts: 1,
      },
    }),
  ];
}

async function getTopics() {
  const devForumTopics = await fetchDevForumTopics();
  const topics = devForumTopics.length > 0 ? devForumTopics : fallbackTopics();

  return topics
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 6);
}

export async function GET() {
  const topics = await getTopics();

  return NextResponse.json({
    success: true,
    total: topics.length,
    topics,
  });
}

export async function POST() {
  const topics = await getTopics();

  return NextResponse.json({
    success: true,
    total: topics.length,
    topics,
  });
}