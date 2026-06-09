import { NextResponse } from "next/server";

interface RobloxTopic {
  title: string;
  link: string;
}

export const runtime = "edge";

export async function GET() {
  try {
    // Contoh fetch dummy dari 3 source
    const devforumData = [
      { title: "DevForum Post 1", link: "https://devforum.roblox.com/t/1" },
      { title: "DevForum Post 2", link: "https://devforum.roblox.com/t/2" },
    ];

    const newsroomData = [
      { title: "Newsroom Post 1", link: "https://www.roblox.com/newsroom/1" },
    ];

    const twitterData = [
      { title: "Twitter Post 1", link: "https://twitter.com/Roblox/status/1" },
    ];

    // Gabungkan semua topik
    const allSources: RobloxTopic[] = [...devforumData, ...newsroomData, ...twitterData];
    const topics: RobloxTopic[] = [];
    const titles = new Set<string>();

    for (const t of allSources) {
      const title = t.title;
      if (!titles.has(title) && topics.length < 6) {
        titles.add(title);
        topics.push(t);
      }
    }

    return NextResponse.json({ success: true, source: "aggregate-official", topics });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to fetch Roblox news" });
  }
}
