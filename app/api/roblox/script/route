import { callAIJson } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = body?.topic;
    const language = body?.language || "English";
    const duration = body?.duration || "60 seconds";
    const style = body?.style || "Natural News";
    if (!topic) return Response.json({ error: "Topik belum dipilih." }, { status: 400 });

    const system = `You are a professional Roblox YouTube Shorts producer, scriptwriter, VO director, and gameplay director. Return only valid JSON.`;
    const user = `Generate a complete Roblox Shorts production package.

Selected topic:
${JSON.stringify(topic, null, 2)}

Settings:
- Language: ${language}
- Duration: ${duration}
- VO style: ${style}
- Video length: 45-60 seconds
- Scene count: 5 scenes

MANDATORY RULES:
1. First 3 seconds must be a very strong scroll-stopping hook. No greeting. No slow intro.
2. Ending CTA must strongly encourage comment, like, and subscribe/follow naturally.
3. CTA formula: question + comment prompt + like + subscribe/follow reason.
4. VO must sound human, natural, and not robotic.
5. Each scene must include exactly 2 image prompts.
6. Every scene must include gameplay direction: what Roblox gameplay to record, camera movement, clip duration, and purpose.
7. Gameplay should support the news/topic, not replace it. Target visual mix: topic visuals 50%, personal gameplay 20%, animated text 15%, effects/transitions 10%, CTA 5%.
8. Do not invent dangerous/exploit instructions. Safety topics must use neutral illustrative gameplay.

Return JSON exactly:
{
  "videoTitle": "short optimized title",
  "language": "${language}",
  "durationTarget": "${duration}",
  "topicScore": {
    "uniqueShock": number,
    "trendRelevance": number,
    "visualizability": number,
    "easyToUnderstand": number,
    "engagementPotential": number,
    "totalOutOf50": number,
    "category": "Very suitable/Suitable/Reconsider/Replace"
  },
  "scenes": [
    {
      "scene": 1,
      "name": "Strong Hook",
      "duration": "0-3s",
      "goal": "stop scrolling",
      "overlayText": "big overlay text",
      "vo": "voice over for this scene",
      "imagePrompts": ["prompt 1 vertical 9:16", "prompt 2 vertical 9:16"],
      "gameplayDirection": "exact gameplay to record and how to use it",
      "editingDirection": "zoom/pan/glitch/text/sfx",
      "sfx": "sound effect idea"
    }
  ],
  "fullVO": "combined full VO copy-ready",
  "gameplayPlan": {
    "mainGameplayType": "recommended gameplay type",
    "recommendedRobloxGamesOrMaps": ["game/map type ideas"],
    "clipsToRecord": ["clip list with duration and scene usage"],
    "recordingTips": ["tips"]
  },
  "caption": "copy-ready caption",
  "description": "copy-ready YouTube Shorts description",
  "hashtags": ["#Roblox"],
  "pinnedComment": "comment that invites replies",
  "thumbnailTexts": ["text options"],
  "assetChecklist": ["assets needed"],
  "finalQualityChecklist": ["hook check", "cta check", "vo check"]
}`;

    const result = await callAIJson([ { role: "system", content: system }, { role: "user", content: user } ], 0.78);
    return Response.json(result.parsed ? { result: result.parsed } : { raw: result.raw });
  } catch (err: any) {
    return Response.json({ error: err?.message || "Gagal generate script Roblox." }, { status: 500 });
  }
}
