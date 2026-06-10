// pages/api/search-roblox-update.js

const CATEGORY_CONFIG = {
  "natural-news": {
    label: "Natural News",
    queryParts: [
      "Roblox official news update release",
      "Roblox developer blog news",
      "Roblox platform update",
      "Roblox announcements latest"
    ]
  },
  "excited-gaming": {
    label: "Excited Gaming",
    queryParts: [
      "Roblox trending games latest",
      "Roblox popular gameplay update",
      "Roblox new event update",
      "Roblox viral game update"
    ]
  },
  "mystery": {
    label: "Mystery",
    queryParts: [
      "Roblox hidden secrets",
      "Roblox secret easter egg",
      "Roblox mystery update",
      "Roblox unknown features"
    ]
  },
  "fun-facts": {
    label: "Fun Facts",
    queryParts: [
      "Roblox fun facts trivia",
      "Roblox interesting facts",
      "Roblox unusual facts",
      "Roblox history facts"
    ]
  }
};

function normalizeCategory(category) {
  const value = String(category || "").toLowerCase().trim();
  if (value.includes("natural")) return "natural-news";
  if (value.includes("excited") || value.includes("gaming")) return "excited-gaming";
  if (value.includes("mystery")) return "mystery";
  if (value.includes("fun")) return "fun-facts";
  return CATEGORY_CONFIG[value] ? value : "natural-news";
}

// Fungsi panggil Tavily API dengan logging debug
async function searchWithTavily(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY belum diatur di Vercel");

  const uniqueQuery = `${query} &rand=${Date.now()}`; // query unik setiap request
  console.log("DEBUG: Query dikirim ke Tavily:", uniqueQuery);

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: uniqueQuery,
      search_depth: "basic",
      include_answer: false,
      include_raw_content: false,
      max_results: 5
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Search API error: ${text}`);
  }

  const data = await response.json();
  console.log("DEBUG: Hasil Tavily:", data.results);

  return (data.results || []).map((item) => ({
    title: item.title || "",
    url: item.url || "",
    summary: item.content || "",
    score: item.score || 0,
    source: item.source || "unknown"
  }));
}

// Handler API final
export default async function handler(req, res) {
  try {
    const categoryKey = normalizeCategory(req.query.category);
    const keyword = String(req.query.keyword || "Roblox").trim();
    const config = CATEGORY_CONFIG[categoryKey];

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const timeStr = today.toTimeString().split(" ")[0];

    const collected = [];
    const usedUrls = new Set();

    for (const queryPart of config.queryParts) {
      const finalQuery = `${queryPart} ${keyword} when:7d`;
      const results = await searchWithTavily(finalQuery);

      for (const item of results) {
        const urlKey = item.url.split("?")[0].replace(/\/$/, "");
        if (!item.title || !item.summary || usedUrls.has(urlKey)) continue;

        usedUrls.add(urlKey);

        collected.push({
          title: item.title,
          summary: item.summary,
          url: item.url,
          source: item.source,
          score: item.score,
          queryUsed: finalQuery,
          category: config.label,
          dateFetched: dateStr,
          timeFetched: timeStr
        });

        if (collected.length >= 6) break;
      }
      if (collected.length >= 6) break;
    }

    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=300");

    return res.status(200).json({
      success: true,
      date: dateStr,
      time: timeStr,
      categoryKey: categoryKey,
      categoryLabel: config.label,
      totalResults: collected.length,
      sources: collected,
      message: collected.length
        ? `Data kategori ${config.label} berhasil ditemukan dari Tavily API`
        : `Tidak ada data terbaru untuk kategori ${config.label} hari ini`
    });
  } catch (error) {
    console.error("DEBUG: Error API", error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}