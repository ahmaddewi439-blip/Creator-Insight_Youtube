import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Normalisasi topik agar kompatibel dengan UI
function normalizeTopic(topic: any, index: number) {
  const metrics = topic.metrics || {};
  const totalScore =
    (metrics.trend || 0) + (metrics.visual || 0) + (metrics.engagement || 0);

  return {
    id: topic?.id || `topic-${index + 1}`,
    title: topic?.title || `Roblox Official Update ${index + 1}`,
    source: topic?.source || "Roblox Official",
    link: topic?.link || topic?.url || "",
    url: topic?.url || topic?.link || "",
    date: topic?.date || topic?.publishedAt || "",
    summary:
      topic?.summary || "Update resmi Roblox dari Newsroom, DevForum, atau akun official.",
    score: totalScore,
    topicScore: {
      trend: metrics.trend || 0,
      visual: metrics.visual || 0,
      engagement: metrics.engagement || 0,
      totalOutOf50: totalScore,
    },
    scoreLabel: `${totalScore}/50`,
    confidence: topic?.confidence || "low",
    whyTrending:
      topic?.whyTrending || "Topik ini berasal dari sumber resmi Roblox.",
    trendReason: topic?.trendReason || "Aktual dan ramai di komunitas Roblox.",
  };
}

// Fetch semua topik Roblox dari official sources
async function getTopics(req: Request) {
  try {
    // DEVFORUM
    const devForumResp = await fetch("https://devforum.roblox.com/latest.json");
    const devForumData = await devForumResp.json();
    const devTopics = (devForumData?.topics || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      link: `https://devforum.roblox.com/t/${t.slug}/${t.id}`,
      source: "DevForum",
      date: t.created_at,
      summary: t.excerpt,
      metrics: { trend: t.views || 0, visual: 5, engagement: t.reply_count || 0 },
      confidence: "high",
    }));

    // NEWSROOM
    const newsResp = await fetch(
      "https://en.help.roblox.com/hc/en-us/sections/360005972993-Roblox-News.json"
    );
    const newsData = await newsResp.json();
    const newsTopics = (newsData?.articles || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      link: n.url,
      source: "Newsroom",
      date: n.published_at,
      summary: n.excerpt,
      metrics: { trend: 5, visual: 5, engagement: 0 },
      confidence: "medium",
    }));

    // TWITTER/X (placeholder)
    const twitterResp = await fetch("https://api.twitter.com/2/tweets?ids=<tweet_ids>", {
      headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` },
    });
    const twitterData = await twitterResp.json();
    const twitterTopics = (twitterData?.data || []).map((tw: any) => ({
      id: tw.id,
      title: tw.text,
      link: `https://twitter.com/Roblox/status/${tw.id}`,
      source: "Twitter",
      date: tw.created_at,
      summary: tw.text,
      metrics: { trend: 5, visual: 5, engagement: tw.public_metrics?.like_count || 0 },
      confidence: "medium",
    }));

    const allTopics = [...devTopics, ...newsTopics, ...twitterTopics];

    return allTopics.map(normalizeTopic);
  } catch (err: any) {
    console.error("Failed fetching Roblox topics:", err.message);
    return [];
  }
}

// POST handler untuk Generate Ide
export async function POST(req: Request) {
  try {
    const topics = await getTopics(req);

    return NextResponse.json({
      success: true,
      total: topics.length,
      topics,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Gagal mengambil topik Roblox.",
      topics: [],
      status: 500,
    });
  }
}

// GET handler untuk health check
export async function GET(req: Request) {
  return NextResponse.json({
    status: "API Roblox Official Aggregate ready",
    timestamp: new Date(),
    sampleTopics: await getTopics(req),
  });
}
