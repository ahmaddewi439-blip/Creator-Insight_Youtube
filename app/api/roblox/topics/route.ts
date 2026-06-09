import { NextResponse } from "next/server";

export const runtime = "nodejs";

type OfficialTopic = {
  title: string;
  link: string;
  source: string;
  date?: string;
  summary?: string;
  score?: number;
};

function normalizeTopic(item: any, index: number): OfficialTopic {
  if (typeof item === "string") {
    return {
      title: item.replace(/<[^>]*>/g, "").trim() || `Roblox Official Update ${index + 1}`,
      link: "https://about.roblox.com/newsroom",
      source: "Roblox Official",
      date: new Date().toISOString(),
      summary: "Topik resmi Roblox dari sumber official.",
      score: 80 - index,
    };
  }

  return {
    title: item?.title || item?.name || item?.text || `Roblox Official Update ${index + 1}`,
    link: item?.link || item?.url || item?.href || "https://about.roblox.com/newsroom",
    source: item?.source || item?.sourceType || "Roblox Official",
    date: item?.date || item?.publishedAt || item?.created_at || new Date().toISOString(),
    summary:
      item?.summary ||
      item?.description ||
      "Update resmi Roblox dari Newsroom, DevForum, atau Twitter/X official.",
    score: item?.score || Math.max(70, 90 - index * 3),
  };
}

async function getTopics(req: Request): Promise<OfficialTopic[]> {
  const origin = new URL(req.url).origin;

  try {
    const res = await fetch(`${origin}/api/roblox/official/aggregate`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Aggregate failed");
    }

    const data = await res.json();
    const rawTopics = Array.isArray(data) ? data : data.topics || [];

    const seen = new Set<string>();
    const topics: OfficialTopic[] = [];

    for (let i = 0; i < rawTopics.length; i++) {
      const topic = normalizeTopic(rawTopics[i], i);
      const key = topic.title.toLowerCase();

      if (!seen.has(key) && topics.length < 6) {
        seen.add(key);
        topics.push(topic);
      }
    }

    if (topics.length > 0) return topics;
  } catch (error) {
    console.log("Roblox official aggregate fallback used.");
  }

  return [
    {
      title: "Roblox Newsroom Updates",
      link: "https://about.roblox.com/newsroom",
      source: "Roblox Newsroom",
      date: new Date().toISOString(),
      summary: "Sumber resmi Roblox untuk berita besar, pengumuman, event, dan update perusahaan.",
      score: 85,
    },
    {
      title: "Roblox DevForum Announcements",
      link: "https://devforum.roblox.com/c/updates/announcements/36",
      source: "Roblox DevForum",
      date: new Date().toISOString(),
      summary: "Sumber resmi Roblox untuk update platform, creator, Studio, dan fitur developer.",
      score: 82,
    },
    {
      title: "Roblox Official Social Updates",
      link: "https://twitter.com/Roblox",
      source: "Twitter/X Official",
      date: new Date().toISOString(),
      summary: "Sumber sosial resmi Roblox untuk update cepat dan pengumuman terbaru.",
      score: 78,
    },
  ];
}

async function response(req: Request) {
  const topics = await getTopics(req);

  return NextResponse.json({
    success: true,
    sourcePolicy: "official-first",
    notice:
      "Topik diambil dari Roblox official sources: Newsroom, DevForum, dan Twitter/X official.",
    total: topics.length,
    topics,
  });
}

export async function GET(req: Request) {
  return response(req);
}

export async function POST(req: Request) {
  return response(req);
}
