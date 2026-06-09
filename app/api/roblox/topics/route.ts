import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TopicMetrics = {
  views: number;
  replies: number;
  likes: number;
  posts: number;
};

type TopicScore = {
  totalOutOf50: number;
  category: string;
  trendRelevance: number;
  visualizability: number;
  engagementPotential: number;
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
  topicScore: TopicScore;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function toNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function daysSince(dateValue: string) {
  if (!dateValue) return 60;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return 60;

  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function getRecencyScore(dateValue: string) {
  const days = daysSince(dateValue);

  if (days <= 1) return 20;
  if (days <= 3) return 18;
  if (days <= 7) return 15;
  if (days <= 14) return 12;
  if (days <= 30) return 8;

  return 4;
}

function getVisualScore(title: string, summary: string) {
  const text = `${title} ${summary}`.toLowerCase();

  const visualKeywords = [
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
    "feature",
    "debug",
    "release",
    "service",
  ];

  const hits = visualKeywords.filter((keyword) => text.includes(keyword)).length;

  return clamp(8 + hits * 2, 8, 20);
}

function getEngagementScore(metrics: TopicMetrics) {
  const raw =
    Math.log10(Math.max(metrics.views, 1)) * 7 +
    Math.log10(Math.max(metrics.replies + 1, 1)) * 8 +
    Math.log10(Math.max(metrics.likes + 1, 1)) * 7 +
    Math.log10(Math.max(metrics.posts + 1, 1)) * 4;

  return clamp(Math.round(raw), 8, 30);
}

function getTopicScore(params: {
  title: string;
  summary: string;
  date: string;
  metrics: TopicMetrics;
}) {
  const sourceScore = 20;
  const recencyScore = getRecencyScore(params.date);
  const visualScore = getVisualScore(params.title, params.summary);
  const engagementScore = getEngagementScore(params.metrics);

  const viralScore = clamp(
    sourceScore + recencyScore + visualScore + engagementScore,
    1,
    100
  );

  const trendRelevance = clamp(
    Math.round((recencyScore + engagementScore) / 5),
    1,
    10
  );

  const visualizability = clamp(Math.round(visualScore / 2), 1, 10);

  const engagementPotential = clamp(Math.round(engagementScore / 3), 1, 10);

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
    totalOutOf50,
    category,
    trendRelevance,
    visualizability,
    engagementPotential,
  };
}

function buildGameplayDirection(title: string, summary: string) {
  const text = `${title} ${summary}`.toLowerCase();

  if (text.includes("compute") || text.includes("performance")) {
    return "Gameplay cocok: tampilkan avatar/gameplay yang terasa lag, lalu transisi ke visual game yang lebih smooth sebagai before-after.";
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
    return "Gameplay cocok: gunakan footage Roblox Studio, creator dashboard, testing gameplay, atau UI debugging dengan overlay penjelasan.";
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
  const score = getTopicScore({
    title,
    summary,
    date: input.date,
    metrics: input.metrics,
  });

  const whyTrending = `Topik ini punya sinyal aktual dari sumber resmi: ${input.metrics.views.toLocaleString(
    "en"
  )} views, ${input.metrics.replies.toLocaleString(
    "en"
  )} replies, dan ${input.metrics.likes.toLocaleString("en")} likes.`;

  const potentialViews =
    score.viralScore >= 80
      ? "Potensi tinggi untuk Shorts karena sumber resmi, aktual, dan mudah dibuat hook."
      : score.viralScore >= 65
        ? "Potensi sedang-tinggi. Cocok jika dibuka dengan hook kuat dan gameplay jelas."
        : "Potensi sedang. Perlu angle yang lebih tajam agar menarik.";

  const shortsFit =
    score.visualizability >= 7
      ? "Cocok untuk Shorts karena bisa divisualkan dengan gameplay, teks animasi, dan source screenshot."
      : "Bisa dijadikan Shorts, tetapi butuh visual gameplay pendukung agar tidak terasa seperti slide berita.";

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
    confidence: "high",
    whyTrending,
    potentialViews,
    shortsFit,
    gameplayDirection: buildGameplayDirection(title, summary),
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
  const res = await fetch(
    "https://devforum.roblox.com/c/updates/announcements/36/l/latest.json",
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`DevForum fetch failed: ${res.status}`);
  }

  const data = await res.json();
  const rawTopics = data?.topic_list?.topics;

  if (!Array.isArray(rawTopics)) {
    throw new Error("DevForum response tidak berisi topic_list.topics.");
  }

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
}

async function fetchNewsroomTopics(): Promise<RobloxTopic[]> {
  try {
    const res = await fetch("https://about.roblox.com/newsroom", {
      cache: "no-store",
      headers: {
        Accept: "text/html",
      },
    });

    if (!res.ok) return [];

    const html = await res.text();

    const links = [
      ...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi),
    ];

    const topics: RobloxTopic[] = [];
    const seen = new Set<string>();

    for (const match of links) {
      const rawHref = String(match[1] || "");
      const title = cleanText(match[2]);

      if (title.length < 18) continue;
      if (
        /privacy|terms|careers|investor|contact|cookie|accessibility|learn more|read more/i.test(
          title
        )
      ) {
        continue;
      }

      const href = rawHref.startsWith("http")
        ? rawHref
        : `https://about.roblox.com${rawHref.startsWith("/") ? "" : "/"}${rawHref}`;

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
            "Berita resmi dari Roblox Newsroom. Engagement publik tidak selalu tersedia, sehingga score memakai official source dan visual fit.",
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

async function getTopics() {
  const devForumTopics = await fetchDevForumTopics();
  const newsroomTopics = await fetchNewsroomTopics();

  const merged = [...devForumTopics, ...newsroomTopics];
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

    return NextResponse.json({
      success: true,
      total: topics.length,
      topics,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Search Update gagal mengambil topik dari Roblox DevForum.",
        topics: [],
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return response();
}

export async function POST() {
  return response();
}
