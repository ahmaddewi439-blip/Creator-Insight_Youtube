import { NextResponse } from "next/server";

export const runtime = "nodejs";

type OfficialTopic = {
  title: string;
  link: string;
  source: string;
  date?: string;
  summary?: string;
  score?: number;
  scoreBreakdown?: {
    officialSource: number;
    recency: number;
    playerImpact: number;
    visualPotential: number;
    engagementPotential: number;
  };
};

function normalizeSource(source: string) {
  const value = source.toLowerCase();

  if (value.includes("twitter") || value.includes("x")) return "Twitter Official";
  if (value.includes("newsroom")) return "Roblox Newsroom";
  if (value.includes("devforum") || value.includes("forum")) return "Roblox DevForum";

  return source || "Roblox Official";
}

function scoreTopic(topic: OfficialTopic, index: number) {
  const source = topic.source.toLowerCase();

  const officialSource =
    source.includes("newsroom") || source.includes("devforum") || source.includes("twitter")
      ? 25
      : 18;

  const recency = Math.max(12, 20 - index * 2);
  const playerImpact = source.includes("newsroom") ? 18 : source.includes("devforum") ? 16 : 15;
  const visualPotential = 8;
  const engagementPotential = 8;

  const total =
    officialSource + recency + playerImpact + visualPotential + engagementPotential;

  return {
    ...topic,
    score: Math.min(total, 100),
    scoreBreakdown: {
      officialSource,
      recency,
      playerImpact,
      visualPotential,
      engagementPotential,
    },
  };
}

function normalizeTopic(item: any, index: number): OfficialTopic | null {
  if (!item) return null;

  if (typeof item === "string") {
    const titleMatch = item.match(/>(.*?)<\/a>/);
    const linkMatch = item.match(/href="(.*?)"/);

    const title = titleMatch?.[1]?.trim() || item.replace(/<[^>]*>/g, "").trim();
    const rawLink = linkMatch?.[1] || "";

    if (!title) return null;

    let link = rawLink;

    if (link.startsWith("/t/")) {
      link = `https://devforum.roblox.com${link}`;
    }

    if (link.startsWith("/newsroom/")) {
      link = `https://about.roblox.com${link}`;
    }

    return {
      title,
      link: link || "https://about.roblox.com/newsroom",
      source: "Roblox Official",
      date: new Date().toISOString(),
      summary: "Topik resmi Roblox yang diambil dari sumber official.",
    };
  }

  const title =
    item.title ||
    item.name ||
    item.text ||
    item.headline ||
    `Roblox Official Update ${index + 1}`;

  const link =
    item.link ||
    item.url ||
    item.href ||
    item.sourceUrl ||
    "https://about.roblox.com/newsroom";

  const source = normalizeSource(item.source || item.sourceType || item.type || "Roblox Official");

  return {
    title,
    link,
    source,
    date: item.date || item.publishedAt || item.created_at || new Date().toISOString(),
    summary:
      item.summary ||
      item.description ||
      "Update resmi Roblox dari sumber official yang bisa dijadikan bahan konten Shorts.",
  };
}

async function getOfficialTopics(req: Request): Promise<OfficialTopic[]> {
  const origin = new URL(req.url).origin;

  try {
    const res = await fetch(`${origin}/api/roblox/official/aggregate`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Aggregate API failed: ${res.status}`);
    }

    const data = await res.json();
    const rawTopics = Array.isArray(data) ? data : data.topics || [];

    const unique = new Set<string>();
    const topics: OfficialTopic[] = [];

    for (let i = 0; i < rawTopics.length; i++) {
      const normalized = normalizeTopic(rawTopics[i], i);
      if (!normalized) continue;

      const key = normalized.title.toLowerCase();

      if (!unique.has(key) && topics.length < 6) {
        unique.add(key);
        topics.push(scoreTopic(normalized, topics.length));
      }
    }

    if (topics.length > 0) {
      return topics;
    }

    throw new Error("No official topics found.");
  } catch (error) {
    return [
      {
        title: "Roblox Official Updates",
        link: "https://about.roblox.com/newsroom",
        source: "Roblox Newsroom",
        date: new Date().toISOString(),
        summary:
          "Fallback resmi: gunakan Roblox Newsroom sebagai sumber utama jika data otomatis belum terbaca.",
      },
      {
        title: "Roblox Creator Updates",
        link: "https://devforum.roblox.com/c/updates/announcements/36",
        source: "Roblox DevForum",
        date: new Date().toISOString(),
        summary:
          "Fallback resmi: gunakan Roblox DevForum untuk update platform, fitur, dan pengumuman developer.",
      },
      {
        title: "Roblox Social Updates",
        link: "https://twitter.com/Roblox",
        source: "Twitter Official",
        date: new Date().toISOString(),
        summary:
          "Fallback resmi: gunakan akun sosial resmi Roblox untuk sinyal update cepat.",
      },
    ].map((topic, index) => scoreTopic(topic, index));
  }
}

async function buildResponse(req: Request) {
  const topics = await getOfficialTopics(req);

  return NextResponse.json({
    success: true,
    sourcePolicy: "official-first",
    notice:
      "Topik diambil dari sumber official Roblox: Newsroom, DevForum, dan Twitter/X official. YouTube tidak digunakan sebagai sumber utama.",
    total: topics.length,
    topics,
  });
}

export async function GET(req: Request) {
  return buildResponse(req);
}

export async function POST(req: Request) {
  return buildResponse(req);
}
