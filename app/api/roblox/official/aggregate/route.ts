import type { NextApiRequest, NextApiResponse } from "next";

// Tipe data untuk topik Roblox
interface RobloxTopic {
  title: string;
  link: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Ambil data dari 3 sumber: devforum, newsroom, twitter
    const devforumRes = await fetch("https://api-roblox-devforum.example.com/latest");
    const devforumData = await devforumRes.json();

    const newsroomRes = await fetch("https://api-roblox-newsroom.example.com/latest");
    const newsroomData = await newsroomRes.json();

    const twitterRes = await fetch("https://api-roblox-twitter.example.com/latest");
    const twitterData = await twitterRes.json();

    // Gabungkan semua data ke array topics
    const topics: RobloxTopic[] = [];
    const titles = new Set<string>();

    const allSources = [...devforumData, ...newsroomData, ...twitterData];

    allSources.forEach((t) => {
      // Pastikan t adalah objek dengan title dan link
      if (typeof t === "string") {
        t = { title: t, link: "" }; // Jika hanya string, buat objek kosong untuk link
      }

      const title = t.title;
      if (!titles.has(title) && topics.length < 6) {
        titles.add(title);
        topics.push(t);
      }
    });

    res.status(200).json({ topics, source: "devforum + newsroom + twitter" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch Roblox news" });
  }
}
