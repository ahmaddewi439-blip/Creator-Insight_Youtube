import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Normalisasi topik agar compatible dengan UI
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
    whyTrending:
      topic?.whyTrending || "Topik ini berasal dari sumber resmi Roblox.",
    trendReason: topic?.trendReason || "Aktual dan ramai di komunitas Roblox.",
  };
}

// Mock data sementara supaya UI langsung muncul
async function getTopics(req: Request) {
  const topics = [
    {
      id: "topic-1",
      title: "Weekly Roblox Update",
      source: "DevForum",
      link: "https://devforum.roblox.com",
      date: "2026-06-09",
      summary: "Update resmi Roblox dari DevForum.",
      metrics: { trend: 15, visual: 15, engagement: 15 },
      confidence: "high",
      whyTrending: "Topik ramai di DevForum",
      trendReason: "Aktual dan banyak dibahas",
    },
    {
      id: "topic-2",
      title: "New Roblox Event Announcement",
      source: "Newsroom",
      link: "https://news.roblox.com",
      date: "2026-06-09",
      summary: "Event baru Roblox resmi diumumkan.",
      metrics: { trend: 12, visual: 14, engagement: 14 },
      confidence: "medium",
      whyTrending: "Event trending di komunitas",
      trendReason: "Aktual, visual menarik, dan source resmi",
    },
  ];

  // Normalisasi untuk UI
  return topics.map(normalizeTopic);
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

// GET handler untuk health check / debug
export async function GET(req: Request) {
  return NextResponse.json({
    status: "API Roblox Official Aggregate ready",
    timestamp: new Date(),
    sampleTopics: await getTopics(req),
  });
}
