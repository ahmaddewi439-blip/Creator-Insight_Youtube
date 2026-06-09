import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RobloxTopic = {
  id: string;
  title: string;
  source: string;
  link: string;
  url: string;
  date?: string;
  summary: string;
  score: number | null;
  viralScore: number | null;
  topicScore: number | null;
  scoreLabel: string;
  confidence: "high" | "medium" | "low";
  whyTrending: string;
  trendReason: string;
  viewsPotential: string;
  potentialViews: string;
  shortsFit: string;
  cocokShorts: string;
  gameplayFit: string;
  gameplayCocok: string;
  evidence: string[];
  metrics?: {
    views?: number;
    replies?: number;
    likes?: number;
    posts?: number;
  };
  scoreBreakdown: {
    source: number;
    recency: number;
    engagement: number;
    visual: number;
    total: number | null;
  };
};

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function safeIsoDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function daysSince(value?: string) {
  if (!value) return 9999;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 9999;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function recencyScore(value?: string) {
  const days = daysSince(value);
  if (days <= 1) return 30;
  if (days <= 3) return 26;
  if (days <= 7) return 22;
  if (days <= 14) return 16;
  if (days <= 30) return 10;
  if (days <= 60) return 6;
  return 0;
}

function visualScore(title: string, summary = "") {
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
    "update",
    "feature",
    "creator",
    "safety",
    "chat",
    "age",
    "ai",
  ];

  const matched = visualKeywords.filter((keyword) => text.includes(keyword));
  return Math.min(20, matched.length * 4);
}

function engagementScore(metrics: {
  views?: number;
  replies?: number;
  likes?: number;
  posts?: number;
}) {
  const views = metrics.views || 0;
  const replies = metrics.replies || 0;
  const likes = metrics.likes || 0;
  const posts = metrics.posts || 0;

  const score =
    Math.log10(Math.max(1, views)) * 8 +
    Math.log10(Math.max(1, replies + 1)) * 10 +
    Math.log10(Math.max(1, likes + 1)) * 8 +
    Math.log10(Math.max(1, posts + 1)) * 6;

  return Math.min(30, Math.round(score));
}

function makeTopic(params: {
  id: string;
  title: string;
  source: string;
  link: string;
  date?: string;
  summary: string;
  metrics?: {
    views?: number;
    replies?: number;
    likes?: number;
    posts?: number;
  };
}): RobloxTopic {
  const sourcePoint = 20;
  const recency = recencyScore(params.date);
  const visual = visualScore(params.title, params.summary);
  const engagement = params.metrics ? engagementScore(params.metrics) : 0;

  const hasEngagement =
    !!params.metrics &&
    ((params.metrics.views || 0) > 0 ||
      (params.metrics.replies || 0) > 0 ||
      (params.metrics.likes || 0) > 0);

  const total = Math.min(100, sourcePoint + recency + visual + engagement);

  const confidence: RobloxTopic["confidence"] = hasEngagement
    ? "high"
    : params.date
      ? "medium"
      : "low";

  const scoreLabel =
    confidence === "high"
      ? `${total}/100`
      : `${total}/100 · data terbatas`;

  const views = params.metrics?.views ?? 0;
  const replies = params.metrics?.replies ?? 0;
  const likes = params.metrics?.likes ?? 0;

  const whyTrending = hasEngagement
    ? `Topik ini punya sinyal aktual dari sumber resmi: ${views.toLocaleString(
        "en"
      )} views, ${replies.toLocaleString("en")} replies, dan ${likes.toLocaleString(
        "en"
      )} likes di DevForum.`
    : `Topik ini berasal dari sumber resmi Roblox, tetapi sumber ini tidak menyediakan data engagement publik lengkap. Score dihitung dari recency, sumber, dan kecocokan visual.`;

  const viewsPotential =
    total >= 80
      ? "Potensi tinggi untuk Shorts karena sumber resmi, aktual, dan mudah divisualkan."
      : total >= 60
        ? "Potensi sedang. Cocok dibuat Shorts jika angle hook dibuat kuat."
        : "Potensi terbatas. Perlu angle yang lebih spesifik agar menarik.";

  const shortsFit =
    visual >= 12
      ? "Cocok untuk Shorts karena bisa divisualkan dengan gameplay, teks animasi, dan source screenshot."
      : "Bisa dibuat Shorts, tetapi perlu tambahan visual pendukung agar tidak terasa seperti slide berita.";

  const gameplayFit =
    /avatar|item|limited|free|event|marketplace|game|experience/i.test(
      `${params.title} ${params.summary}`
    )
      ? "Gameplay cocok: avatar showcase, event lobby, marketplace, inventory, atau gameplay Roblox yang relevan."
      : "Gameplay cocok: gunakan gameplay Roblox umum sebagai background sambil fokus pada teks berita dan source visual.";

  return {
    id: params.id,
    title: params.title,
    source: params.source,
    link: params.link,
    url: params.link,
    date: params.date,
    summary: params.summary,
    score: total,
    viralScore: total,
    topicScore: total,
    scoreLabel: `${total}/100`,
    confidence,
    whyTrending,
    trendReason: whyTrending,
    viewsPotential,
    potentialViews: viewsPotential,
    shortsFit,
    cocokShorts: shortsFit,
    gameplayFit,
    gameplayCocok: gameplayFit,
    evidence: [
      `Source: ${params.source}`,
      params.date ? `Date: ${params.date}` : "Date: not provided by source",
      hasEngagement
        ? `Engagement: ${views} views, ${replies} replies, ${likes} likes`
        : "Engagement: not publicly available from this source",
    ],
    metrics: params.metrics,
    scoreBreakdown: {
      source: sourcePoint,
      recency,
      engagement,
      visual,
      total,
    },
  };
}

async function fetchDevForumTopics(): Promise<RobloxTopic[]> {
  const res = await fetch(
    "https://devforum.roblox.com/c/updates/announcements/36/l/latest.json",
    { cache: "no-store" }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const topics = data?.topic_list?.topics;

  if (!Array.isArray(topics)) return [];

  return topics.slice(0, 8).map((topic: any) => {
    const title = cleanText(topic?.title || "Roblox DevForum Update");
    const link = `https://devforum.roblox.com/t/${topic?.slug || "topic"}/${
      topic?.id
    }`;

    const views = Number(topic?.views || 0);
    const replies = Number(topic?.reply_count || 0);
    const likes = Number(topic?.like_count || 0);
    const posts = Number(topic?.posts_count || 0);

    return makeTopic({
      id: `devforum-${topic?.id}`,
      title,
      source: "Roblox DevForum",
      link,
      date: safeIsoDate(topic?.last_posted_at || topic?.created_at),
      summary:
        "Update resmi dari Roblox DevForum Announcements untuk creator, Studio, platform, atau fitur Roblox.",
      metrics: {
        views,
        replies,
        likes,
        posts,
      },
    });
  });
}

async function fetchNewsroomTopics(): Promise<RobloxTopic[]> {
  const res = await fetch("https://about.roblox.com/newsroom", {
    cache: "no-store",
  });

  if (!res.ok) return [];

  const html = await res.text();
  const links = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

  const seen = new Set<string>();
  const topics: RobloxTopic[] = [];

  for (const match of links) {
    const rawHref = match[1] || "";
    const title = cleanText(match[2] || "");

    if (title.length < 18) continue;
    if (/read more|learn more|see all/i.test(title)) continue;

    const href = rawHref.startsWith("http")
      ? rawHref
      : `https://about.roblox.com${rawHref.startsWith("/") ? "" : "/"}${rawHref}`;

    if (!href.includes("roblox.com")) continue;

    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    topics.push(
      makeTopic({
        id: `newsroom-${topics.length + 1}`,
        title,
        source: "Roblox Newsroom",
        link: href,
        summary:
          "Berita resmi Roblox dari Newsroom. Sumber ini official, tetapi biasanya tidak menyediakan public engagement seperti views atau replies.",
      })
    );

    if (topics.length >= 5) break;
  }

  return topics;
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
      const likes = Number(tweet?.public_metrics?.like_count || 0);
      const replies = Number(tweet?.public_metrics?.reply_count || 0);
      const views = Number(tweet?.public_metrics?.impression_count || 0);

      return makeTopic({
        id: `x-${tweet?.id}`,
        title: cleanText(tweet?.text || "Roblox Official X Update").slice(0, 110),
        source: "Roblox Official X",
        link: `https://x.com/Roblox/status/${tweet?.id}`,
        date: safeIsoDate(tweet?.created_at),
        summary:
          "Update dari akun X official Roblox. Score memakai public metrics dari X API jika tersedia.",
        metrics: {
          views,
          replies,
          likes,
          posts: 1,
        },
      });
    });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const [devforum, newsroom, xTopics] = await Promise.all([
      fetchDevForumTopics(),
      fetchNewsroomTopics(),
      fetchXTopics(),
    ]);

    const merged = [...devforum, ...newsroom, ...xTopics];

    const seen = new Set<string>();
    const topics = merged
      .filter((topic) => {
        const key = topic.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const scoreA = a.score ?? 0;
        const scoreB = b.score ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return daysSince(a.date) - daysSince(b.date);
      })
      .slice(0, 6);

    return NextResponse.json({
      success: true,
      source: "official-real-sources",
      scoringPolicy:
        "Score dihitung dari metadata aktual: official source, recency, public engagement jika tersedia, dan visualizability. Jika engagement tidak tersedia, confidence ditandai medium/low.",
      topics,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch Roblox official topics.",
        topics: [],
      },
      { status: 500 }
    );
  }
}