import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

    whyTrending:
      topic?.whyTrending ||
      topic?.trendReason ||
      "Topik ini berasal dari sumber resmi Roblox.",
    trendReason:
      topic?.trendReason ||
      topic?.whyTrending ||
      "Topik ini berasal dari sumber resmi Roblox.",

    viewsPotential:
      topic?.viewsPotential ||
      topic?.potentialViews ||
      "Potensi views dihitung dari metadata aktual yang tersedia.",
    potentialViews:
      topic?.potentialViews ||
      topic?.viewsPotential ||
      "Potensi views dihitung dari metadata aktual yang tersedia.",

    shortsFit:
      topic?.shortsFit ||
      topic?.cocokShorts ||
      "Cocok untuk Shorts jika dibuat dengan hook kuat dan visual Roblox yang jelas.",
    cocokShorts:
      topic?.cocokShorts ||
      topic?.shortsFit ||
      "Cocok untuk Shorts jika dibuat dengan hook kuat dan visual Roblox yang jelas.",

    gameplayFit:
      topic?.gameplayFit ||
      topic?.gameplayCocok ||
      "Gunakan gameplay Roblox yang mendukung konteks berita.",
    gameplayCocok:
      topic?.gameplayCocok ||
      topic?.gameplayFit ||
      "Gunakan gameplay Roblox yang mendukung konteks berita.",

    evidence: topic?.evidence || [],
    metrics: topic?.metrics || null,
    scoreBreakdown: topic?.scoreBreakdown || null,
  };
}

async function getTopics(req: Request) {
  const origin = new URL(req.url).origin;

  const res = await fetch(`${origin}/api/roblox/official/aggregate`, {
    cache: "no-store",
  });

  const data = await res.json();

  const rawTopics = Array.isArray(data)
    ? data
    : Array.isArray(data?.topics)
      ? data.topics
      : [];

  return rawTopics.slice(0, 6).map(normalizeTopic);
}

async function response(req: Request) {
  try {
    const topics = await getTopics(req);

    return NextResponse.json({
      success: true,
      sourcePolicy: "official-real-sources",
      total: topics.length,
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

export async function GET(req: Request) {
  return response(req);
}

export async function POST(req: Request) {
  return response(req);
}