export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // =========================
  // 1. INPUT DYNAMIC (NICHES)
  // =========================
  const niche = searchParams.get("niche") || "general";

  // =========================
  // 2. SIMULASI DATA ENGINE
  // (nanti kita upgrade ke REAL API)
  // =========================
  const demandMap: any = {
    gaming: 85,
    finance: 90,
    science: 80,
    history: 75,
    general: 70
  };

  const competitionMap: any = {
    gaming: 70,
    finance: 60,
    science: 55,
    history: 50,
    general: 65
  };

  const trendMap: any = {
    gaming: 90,
    finance: 85,
    science: 75,
    history: 70,
    general: 60
  };

  const demand = demandMap[niche] || 65;
  const lowCompetition = 100 - (competitionMap[niche] || 60);
  const trendBoost = trendMap[niche] || 50;

  // =========================
  // 3. SCORING ENGINE (REAL LOGIC BASE)
  // =========================
  const score = Math.round(
    demand * 0.4 +
    lowCompetition * 0.4 +
    trendBoost * 0.2
  );

  // =========================
  // 4. KEYWORD GENERATOR ENGINE
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
        "dark truth investing",
        "passive income nobody talks about",
        "wealth habits rich people hide"
      ],

      science: [
        "unbelievable science facts",
        "space mysteries explained",
        "human body secrets revealed",
        "physics that break reality",
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
      "underrated viral topics",
      "crazy unknown stories",
      "internet secrets revealed"
    ];
  }

  const keywords = generateKeywords(niche);

  // =========================
  // 5. RESPONSE FINAL
  // =========================
  return Response.json({
    success: true,
    niche,
    score,
    metrics: {
      demand,
      lowCompetition,
      trendBoost
    },
    keywords
  });
}