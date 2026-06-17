import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { topic, duration, language } = await req.json();
  
  // Di sini API Anda memanggil model AI (OpenAI/Gemini/dll)
  // Ini adalah struktur data matang yang akan dikembalikan ke web Anda
  const fullScript = {
    hook: `Tahukah kamu? Ada rahasia mengejutkan di ${topic} dalam durasi ${duration} menit yang bakal bikin kamu melongo!`,
    content: `Pembahasan mendalam ${topic} bahasa ${language}...`,
    cta: "Jangan lupa subscribe, like, dan share!",
    visualPrompts: [
      { scene: 1, prompt: "Cinematic shot of Roblox environment, dark green aesthetic, 9:16 aspect ratio" },
      { scene: 2, prompt: "High contrast gameplay footage of " + topic }
    ]
  };

  return NextResponse.json(fullScript);
}