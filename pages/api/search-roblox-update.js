const CATEGORY_CONFIG = {
  "natural-news": {
    label: "Natural News",
    queryParts: [
      "Roblox official news",
      "Roblox latest update",
      "Roblox platform update",
      "Roblox developer update"
    ],
    blockedWords: ["fun facts", "mystery", "secret", "scary", "creepy"]
  },

  "excited-gaming": {
    label: "Excited Gaming",
    queryParts: [
      "Roblox trending games",
      "Roblox popular game update",
      "Roblox new game event",
      "Roblox viral game"
    ],
    blockedWords: ["official news", "fun facts", "mystery", "secret"]
  },

  "mystery": {
    label: "Mystery",
    queryParts: [
      "Roblox mystery",
      "Roblox secret",
      "Roblox hidden update",
      "Roblox easter egg"
    ],
    blockedWords: ["official news", "trending games", "fun facts"]
  },

  "fun-facts": {
    label: "Fun Facts",
    queryParts: [
      "Roblox fun facts",
      "Roblox interesting facts",
      "Roblox facts players don't know",
      "Roblox history facts"
    ],
    blockedWords: ["official news", "trending games", "mystery", "secret"]
  }
};

function normalizeCategory(category) {
  const value = String(category || "").toLowerCase().trim();

  if (value.includes("natural")) return "natural-news";
  if (value.includes("excited")) return "excited-gaming";
  if (value.includes("gaming")) return "excited-gaming";
  if (value.includes("mystery")) return "mystery";
  if (value.includes("fun")) return "fun-facts";

  if (CATEGORY_CONFIG[value]) return value;

  return "natural-news";
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function getTagValue(item, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = item.match(regex);
  return match ? stripHtml(match[1]) : "";
}

function cleanGoogleNewsUrl(url) {
  const value = String(url || "");
  const match = value.match(/url=([^&]+)/);

  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return value;
    }
  }

  return value;
}

function isRelevantToCategory(item, config) {
  const text = `${item.title} ${item.summary}`.toLowerCase();

  const hasCategoryKeyword = config.queryParts.some((query) => {
    return query
      .toLowerCase()
      .split(" ")
      .some((word) => word.length > 4 && text.includes(word));
  });

  const hasBlockedWord = config.blockedWords.some((word) =>
    text.includes(word.toLowerCase())
  );

  return hasCategoryKeyword && !hasBlockedWord;
}

function parseGoogleNewsRss(xml, config, queryUsed) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

  return items
    .map((item) => {
      const title = getTagValue(item, "title");
      const link = cleanGoogleNewsUrl(getTagValue(item, "link"));
      const pubDate = getTagValue(item, "pubDate");
      const description = getTagValue(item, "description");

      return {
        title,
        url: link,
        publishedAt: pubDate,
        summary: description,
        queryUsed
      };
    })
    .filter((item) => item.title && item.url)
    .filter((item) => isRelevantToCategory(item, config));
}

async function searchGoogleNews(query, config) {
  const rssUrl =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(query) +
    "&hl=en-US&gl=US&ceid=US:en";

  const response = await fetch(rssUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 Creator Insight Roblox Search"
    }
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data Google News.");
  }

  const xml = await response.text();
  return parseGoogleNewsRss(xml, config, query);
}

export default async function handler(req, res) {
  try {
    const categoryKey = normalizeCategory(req.query.category);
    const keyword = String(req.query.keyword || "Roblox").trim();
    const config = CATEGORY_CONFIG[categoryKey];

    const today = new Date().toISOString().slice(0, 10);
    const collected = [];
    const usedUrls = new Set();
    const usedTitles = new Set();

    for (const queryPart of config.queryParts) {
      const finalQuery = `${queryPart} ${keyword} when:7d`;

      const results = await searchGoogleNews(finalQuery, config);

      for (const item of results) {
        const urlKey = item.url.split("?")[0].replace(/\/$/, "");
        const titleKey = item.title.toLowerCase().trim();

        if (usedUrls.has(urlKey)) continue;
        if (usedTitles.has(titleKey)) continue;

        usedUrls.add(urlKey);
        usedTitles.add(titleKey);

        collected.push({
          category: categoryKey,
          categoryLabel: config.label,
          title: item.title,
          summary: item.summary,
          url: item.url,
          publishedAt: item.publishedAt,
          queryUsed: item.queryUsed
        });

        if (collected.length >= 6) break;
      }

      if (collected.length >= 6) break;
    }

    return res.status(200).json({
      success: true,
      date: today,
      category: categoryKey,
      categoryLabel: config.label,
      total: collected.length,
      sources: collected,
      message:
        collected.length > 0
          ? `Data kategori ${config.label} berhasil ditemukan.`
          : `Data terbaru untuk kategori ${config.label} belum ditemukan hari ini.`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Terjadi kesalahan server."
    });
  }
}