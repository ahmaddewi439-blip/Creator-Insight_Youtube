import { NextResponse } from "next/server";

export const runtime = "nodejs";

function normalizeTopic(topic: any, index: number) {
  const metrics = topic?.metrics || {};
  const totalScore = (metrics.trend || 0) + (metrics.visual || 0) + (metrics.engagement || 0);

  return {
    id: topic?.id || `topic-${index + 1}`,
    title: topic?.title || `Roblox Official Update ${index + 1}`,
    source: topic?.source || "Roblox Official",
    link: topic?.link || topic?.url || "",
    date: topic?.date || topic?.publishedAt || "",
    summary: topic?.summary || "Update resmi Roblox dari sumber resmi.",
    score: totalScore,
    topicScore: {
      trend: metrics.trend || 0,
      visual: metrics.visual || 0,
      engagement: metrics.engagement || 0,
      totalOutOf50: totalScore,
    },
    scoreLabel: `${totalScore}/50`,
    confidence: topic?.confidence || "low",
    whyTrending: topic?.whyTrending || "Topik berasal dari sumber resmi Roblox.",
    trendReason: topic?.trendReason || "Aktual dan ramai di komunitas Roblox.",
  };
}

async function getTopics(req: Request) {
  try {
    const devForumResp = await fetch("https://api.roblox.com/devforum/latest");
    const newsResp = await fetch("https://api.roblox.com/newsroom/latest");
    const twitterResp = await fetch("https://api.twitter.com/roblox-official");

    const devForumData = await devForumResp.json();
    const newsData = await newsResp.json();
    const twitterData = await twitterResp.json();

    const topics = [
      ...(devForumData.topics || []),
      ...(newsData.topics || []),
      ...(twitterData.topics || []),
    ];

    return topics.map(normalizeTopic);
  } catch (error) {
    console.error("Failed to fetch Roblox topics:", error);
    return [];
  }
}

export async function POST(req: Request) {
  const topics = await getTopics(req);
  return NextResponse.json({
    success: true,
    total: topics.length,
    topics,
  });
}

export async function GET(req: Request) {
  const topics = await getTopics(req);
  return NextResponse.json({
    success: true,
    total: topics.length,
    topics,
  });
}
