import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Normalisasi setiap topik agar kompatibel dengan UI
function normalizeTopic(topic: any, index: number) {
  const metrics = topic.metrics || {};
  const totalScore =
    (metrics.trend || 0) +
    (metrics.visual || 0) +
    (metrics.engagement || 0);

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

// Ambil topik dari sumber resmi Roblox
async function getTopics(req: Request) {
  try {
    const devForumResp = await fetch(
      "https://games.roblox.com/v1/updates/devforum" // endpoint DevForum resmi
    );
    const newsResp = await fetch(
      "https://games.roblox.com/v1/updates/newsroom" // endpoint Newsroom resmi
    );
    const twitterResp = await fetch(
      "https://api.twitter.com/2/users/by/username/Roblox/tweets" // endpoint Twitter resmi (butuh Bearer token)
    );

    const devForumData = await devForumResp.json();
    const newsData = await newsResp.json();
    const twitterData = await twitterResp.json();

    // Gabungkan semua topik
    const topics = [
      ...(devForumData.topics || []),
      ...(newsData.topics || []),
      ...(twitterData.data || []), // Twitter: ambil array `data`
    ];

    return topics.map(normalizeTopic);
  } catch (error: any) {
    console.error("Error fetching Roblox topics:", error.message);
    return [];
  }
}

// Endpoint POST untuk UI (Search Update button)
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

// Endpoint GET opsional
export async function GET(req: Request) {
  const topics = await getTopics(req);
  return NextResponse.json(topics);
}
