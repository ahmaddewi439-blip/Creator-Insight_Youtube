import { NextResponse } from "next/server";

export const runtime = "edge";

async function fetchDevForum() {
  const res = await fetch('https://devforum.roblox.com/c/updates/announcements/36');
  const html = await res.text();
  // Dummy parser, ambil 2-3 topik
  return html.match(/<a href="(\/t\/.*?)">([^<]+)<\/a>/g)?.slice(0,3) || [];
}

async function fetchNewsroom() {
  const res = await fetch('https://about.roblox.com/newsroom');
  const html = await res.text();
  return html.match(/<a href="(\/newsroom\/.*?)">([^<]+)<\/a>/g)?.slice(0,3) || [];
}

async function fetchTwitter() {
  // Dummy placeholder, nanti diganti dengan Twitter API v2
  return [
    { title: "Twitter update 1", link: "https://twitter.com/Roblox/status/1" },
    { title: "Twitter update 2", link: "https://twitter.com/Roblox/status/2" }
  ];
}

export async function GET() {
  const [devforum, newsroom, twitter] = await Promise.all([
    fetchDevForum(), fetchNewsroom(), fetchTwitter()
  ]);

  // Gabungkan semua topik, hapus duplikasi, ambil 6 teratas
  const allTopicsRaw = [...devforum, ...newsroom, ...twitter];
  const titles = new Set();
  const topics = [];

  for (const t of allTopicsRaw) {
    const title = typeof t === 'string' ? t : t.title;
    if (!titles.has(title) && topics.length < 6) {
      titles.add(title);
      topics.push(t);
    }
  }

  return NextResponse.json({
    success: true,
    source: "aggregate-official",
    topics
  });
}
