export async function POST(req: Request) {
  try {
    const { niche } = await req.json();

    // =========================
    // 1. SIMULATED REAL DATA LAYER
    // =========================
    const dataMap: any = {
      gaming: { demand: 90, competition: 70, trend: 95 },
      finance: { demand: 85, competition: 60, trend: 90 },
      science: { demand: 80, competition: 55, trend: 85 },
      history: { demand: 75, competition: 50, trend: 80 },
      general: { demand: 70, competition: 65, trend: 60 }
    };

    const data = dataMap[niche] || dataMap.general;

    // =========================
    // 2. SCORING ENGINE (V2 FIXED)
    // =========================
    const score =
      data.demand * 0.4 +
      (100 - data.competition) * 0.4 +
      data.trend * 0.2;

    // =========================
    // 3. KEYWORD ENGINE
    // =========================
    const keywords = generateKeywords(niche);

    // =========================
    // 4. RESPONSE FINAL (STABLE)
    // =========================
    return Response.json({
      success: true,
      niche,
      score: Math.round(score),
      metrics: data,
      keywords
    });

  } catch (err) {
    return Response.json({
      success: false,
      error: "V2_ENGINE_FAILED"
    }, { status: 500 });
  }
}

// =========================
// KEYWORD GENERATOR
// =========================
function generateKeywords(niche: string) {
  const base: any = {
    gaming: [
      "roblox hidden secrets",
      "minecraft unknown hacks",
      "banned game mysteries",
      "insane gameplay tricks",
      "deleted roblox worlds"
    ],
    finance: [
      "hidden money psychology",
      "secret online income methods",
      "passive income nobody talks about",
      "dark truth investing",
      "wealth habits rich people hide"
    ],
    science: [
      "unbelievable science facts",
      "space mysteries explained",
      "physics breaking reality",
      "human body secrets revealed",
      "science experiments gone wrong"
    ],
    history: [
      "forgotten history mysteries",
      "lost ancient civilizations",
      "history erased from books",
      "untold true stories",
      "hidden world war secrets"
    ]
  };

  return base[niche] || [
    "viral unexplained facts",
    "hidden world mysteries",
    "underrated viral topics"
  ];
}