import { callAIJson } from "@/lib/ai";

export const runtime = "nodejs";

type AnyTopic = Record<string, any>;

function fallbackScript(topic: AnyTopic, language: string, duration: string, style: string) {
  const title = topic?.title || "Roblox Update";
  const isIndo = String(language).toLowerCase().includes("indo");

  const scenes = isIndo
    ? [
        {
          scene: 1,
          name: "Strong Hook",
          duration: "0-3s",
          goal: "stop scrolling",
          overlayText: "Player Roblox wajib tahu ini!",
          vo: `Roblox lagi ramai karena ${title}, dan banyak player belum sadar dampaknya.`,
          imagePrompts: [
            "Vertical 9:16 Roblox news thumbnail, shocked Roblox avatars, glowing update icon, dramatic green lighting, high contrast",
            "Vertical 9:16 Roblox avatar looking at a mysterious notification screen, modern gaming UI, suspense atmosphere"
          ],
          gameplayDirection: "Pakai clip avatar berlari cepat di lobby Roblox atau area event. Tambahkan zoom-in cepat di 1 detik pertama.",
          editingDirection: "Fast zoom, glitch transition, big text overlay, notification SFX.",
          sfx: "notification pop + whoosh"
        },
        {
          scene: 2,
          name: "Context",
          duration: "3-12s",
          goal: "explain topic quickly",
          overlayText: "Kenapa ini ramai?",
          vo: "Topik ini ramai karena bisa memengaruhi cara player bermain, mencari item, atau mengikuti event Roblox.",
          imagePrompts: [
            "Vertical 9:16 Roblox event lobby with many players, glowing portal, gaming news style",
            "Vertical 9:16 Roblox marketplace or avatar editor concept, item icons, clean UI, green highlights"
          ],
          gameplayDirection: "Rekam avatar berjalan ke portal/event atau membuka avatar editor/marketplace. Tempo lebih pelan agar VO mudah dipahami.",
          editingDirection: "Pan movement, pop-up keywords, soft zoom.",
          sfx: "soft whoosh"
        },
        {
          scene: 3,
          name: "Main Fact",
          duration: "12-28s",
          goal: "deliver the main value",
          overlayText: "Ini poin utamanya",
          vo: "Poin terpentingnya, player perlu tahu apa yang berubah sebelum melewatkan kesempatan atau salah mengambil keputusan.",
          imagePrompts: [
            "Vertical 9:16 rare Roblox item icons with countdown timer, dramatic gaming lighting",
            "Vertical 9:16 Roblox avatar holding a glowing item while other avatars react with surprise"
          ],
          gameplayDirection: "Pakai clip avatar mengambil reward, membuka inventory, atau menunjukkan item/fasilitas yang dibahas.",
          editingDirection: "Highlight object, countdown overlay, quick cuts.",
          sfx: "item sparkle"
        },
        {
          scene: 4,
          name: "Extra Twist",
          duration: "28-45s",
          goal: "increase curiosity",
          overlayText: "Dampaknya bisa besar",
          vo: "Kalau ini benar berlanjut, update seperti ini bisa mengubah cara event dan item Roblox dibuat ke depannya.",
          imagePrompts: [
            "Vertical 9:16 Roblox event portal with players entering, cinematic green glow, high detail",
            "Vertical 9:16 split screen Roblox players debating an update, one side excited, one side confused"
          ],
          gameplayDirection: "Pakai clip avatar berada di area ramai/event atau map yang relevan. Tambahkan komentar pop-up sebagai visual reaksi player.",
          editingDirection: "Split screen, comment bubbles, parallax.",
          sfx: "riser + pop"
        },
        {
          scene: 5,
          name: "Strong CTA",
          duration: "45-60s",
          goal: "drive comments, likes, subscribe",
          overlayText: "Setuju atau tidak?",
          vo: "Menurut kamu ini update bagus atau malah harus diubah? Tulis pendapat kamu di komentar, like video ini, dan subscribe biar nggak ketinggalan update Roblox berikutnya.",
          imagePrompts: [
            "Vertical 9:16 Roblox avatar pointing to like comment subscribe buttons, green neon gaming background",
            "Vertical 9:16 clean Roblox news end screen with like comment subscribe icons, modern dark green style"
          ],
          gameplayDirection: "Rekam avatar menghadap kamera, melambaikan tangan, atau berdiri di depan background Roblox yang menarik.",
          editingDirection: "Like/comment/subscribe animation, smooth zoom out.",
          sfx: "button click + success chime"
        }
      ]
    : [
        {
          scene: 1,
          name: "Strong Hook",
          duration: "0-3s",
          goal: "stop scrolling",
          overlayText: "Roblox players need to see this!",
          vo: `Roblox players are talking about ${title}, and most people still do not know why it matters.`,
          imagePrompts: [
            "Vertical 9:16 Roblox news thumbnail, shocked Roblox avatars, glowing update icon, dramatic green lighting, high contrast",
            "Vertical 9:16 Roblox avatar looking at a mysterious notification screen, modern gaming UI, suspense atmosphere"
          ],
          gameplayDirection: "Use a fast clip of your avatar running through a Roblox lobby or event area. Add a quick zoom in the first second.",
          editingDirection: "Fast zoom, glitch transition, big text overlay, notification SFX.",
          sfx: "notification pop + whoosh"
        },
        {
          scene: 2,
          name: "Context",
          duration: "3-12s",
          goal: "explain topic quickly",
          overlayText: "Why is this trending?",
          vo: "This topic is getting attention because it could affect how players join events, collect items, or experience Roblox updates.",
          imagePrompts: [
            "Vertical 9:16 Roblox event lobby with many players, glowing portal, gaming news style",
            "Vertical 9:16 Roblox marketplace or avatar editor concept, item icons, clean UI, green highlights"
          ],
          gameplayDirection: "Record your avatar walking toward a portal/event or opening the avatar editor/marketplace. Keep this clip calmer so viewers can follow the VO.",
          editingDirection: "Pan movement, pop-up keywords, soft zoom.",
          sfx: "soft whoosh"
        },
        {
          scene: 3,
          name: "Main Fact",
          duration: "12-28s",
          goal: "deliver the main value",
          overlayText: "Here is the main point",
          vo: "The biggest thing players need to understand is what changed before they miss an opportunity or make the wrong move.",
          imagePrompts: [
            "Vertical 9:16 rare Roblox item icons with countdown timer, dramatic gaming lighting",
            "Vertical 9:16 Roblox avatar holding a glowing item while other avatars react with surprise"
          ],
          gameplayDirection: "Use a clip of your avatar collecting a reward, opening inventory, or showing the item/feature being discussed.",
          editingDirection: "Highlight object, countdown overlay, quick cuts.",
          sfx: "item sparkle"
        },
        {
          scene: 4,
          name: "Extra Twist",
          duration: "28-45s",
          goal: "increase curiosity",
          overlayText: "This could matter later",
          vo: "If this keeps going, updates like this could change how future Roblox events and items work.",
          imagePrompts: [
            "Vertical 9:16 Roblox event portal with players entering, cinematic green glow, high detail",
            "Vertical 9:16 split screen Roblox players debating an update, one side excited, one side confused"
          ],
          gameplayDirection: "Use footage of your avatar in a busy event area or relevant map. Add comment pop-ups to show player reactions.",
          editingDirection: "Split screen, comment bubbles, parallax.",
          sfx: "riser + pop"
        },
        {
          scene: 5,
          name: "Strong CTA",
          duration: "45-60s",
          goal: "drive comments, likes, subscribe",
          overlayText: "Good or bad update?",
          vo: "Do you think this Roblox update is good, or should Roblox change it back? Comment your answer, like this video, and subscribe so you do not miss the next Roblox update.",
          imagePrompts: [
            "Vertical 9:16 Roblox avatar pointing to like comment subscribe buttons, green neon gaming background",
            "Vertical 9:16 clean Roblox news end screen with like comment subscribe icons, modern dark green style"
          ],
          gameplayDirection: "Record your avatar facing the camera, waving, or standing in front of an interesting Roblox background.",
          editingDirection: "Like/comment/subscribe animation, smooth zoom out.",
          sfx: "button click + success chime"
        }
      ];

  return {
    videoTitle: title,
    language,
    durationTarget: duration,
    style,
    topicScore: {
      uniqueShock: 8,
      trendRelevance: 8,
      visualizability: 8,
      easyToUnderstand: 8,
      engagementPotential: 9,
      totalOutOf50: 41,
      category: "Very suitable"
    },
    scenes,
    fullVO: scenes.map((scene) => scene.vo).join(" "),
    gameplayPlan: {
      mainGameplayType: topic?.gameplayDirection || "Roblox event exploration + avatar showcase",
      recommendedRobloxGamesOrMaps: topic?.recommendedGameTypes || ["event game", "obby", "avatar editor", "survival"],
      clipsToRecord: [
        "Scene 1: fast lobby/event run clip, 3 seconds",
        "Scene 2: avatar walking to event/menu, 6-9 seconds",
        "Scene 3: reward/item/feature showcase, 12-16 seconds",
        "Scene 4: busy map or reaction style footage, 10-15 seconds",
        "Scene 5: avatar facing camera for CTA, 5-8 seconds"
      ],
      recordingTips: [
        "Record vertical-friendly footage with the avatar centered.",
        "Keep UI readable and avoid messy crowded clips during explanation.",
        "Use your best moment in the first 3 seconds to stop scrolling."
      ]
    },
    caption: isIndo
      ? "Update Roblox ini lagi ramai. Menurut kamu bagus atau harus diubah?"
      : "This Roblox update is getting attention. Good change or bad change?",
    description: isIndo
      ? "Bahas update Roblox terbaru dengan hook kuat, gameplay pendukung, dan penjelasan singkat untuk Shorts."
      : "A quick Roblox Shorts breakdown with strong hook, gameplay support, and a clear update explanation.",
    hashtags: ["#Roblox", "#RobloxUpdate", "#RobloxNews", "#RobloxShorts", "#Gaming"],
    pinnedComment: isIndo
      ? "Menurut kamu update ini bagus atau tidak? Tulis pendapat kamu 👇"
      : "Do you think this update is good or bad? Comment below 👇",
    thumbnailTexts: isIndo
      ? ["ROBLOX BERUBAH?", "PLAYER WAJIB TAHU", "UPDATE BARU!"]
      : ["ROBLOX CHANGED?", "PLAYERS NEED THIS", "NEW UPDATE!"],
    assetChecklist: ["Roblox gameplay clips", "topic screenshots/source visuals", "like/comment/subscribe animation", "sound effects"],
    finalQualityChecklist: ["First 3 seconds have a strong hook", "VO sounds natural", "CTA asks for comment, like, and subscribe", "Gameplay supports the topic"]
  };
}

export async function GET() {
  return Response.json({
    ok: true,
    endpoint: "/api/roblox/script",
    method: "POST",
    message: "Roblox script route is active. Use POST with { topic, language, duration, style }."
  });
}

export async function POST(request: Request) {
  let topic: AnyTopic | null = null;
  let language = "English";
  let duration = "60 seconds";
  let style = "Natural News";

  try {
    const body = await request.json().catch(() => ({}));
    topic = body?.topic;
    language = body?.language || "English";
    duration = body?.duration || "60 seconds";
    style = body?.style || "Natural News";

    if (!topic) {
      return Response.json({ error: "Topik belum dipilih." }, { status: 400 });
    }

    const system = "You are a professional Roblox YouTube Shorts producer, scriptwriter, VO director, and gameplay director. Return only valid JSON.";
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

    const result = await callAIJson([{ role: "system", content: system }, { role: "user", content: user }], 0.78);

    if (result.parsed) {
      return Response.json({ result: result.parsed });
    }

    return Response.json({
      result: fallbackScript(topic, language, duration, style),
      fallback: true,
      warning: "AI response was not valid JSON, so fallback script was returned.",
      raw: result.raw
    });
  } catch (err: any) {
    if (!topic) {
      return Response.json({ error: err?.message || "Gagal generate script Roblox." }, { status: 500 });
    }

    return Response.json({
      result: fallbackScript(topic, language, duration, style),
      fallback: true,
      warning: err?.message || "Gagal generate script Roblox, fallback script returned."
    });
  }
}
