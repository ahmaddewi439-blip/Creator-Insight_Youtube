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

    return NextResponse.json({
      success: true,
      total: topics.length,
      sourcePolicy:
        "Official Roblox sources only: DevForum Announcements, Roblox Newsroom, and Roblox Official X if token is available.",
      topics,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal mengambil topik Roblox.",
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
