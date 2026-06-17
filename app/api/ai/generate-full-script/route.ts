import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { topic, duration, language } = await req.json();
  
  // Ini adalah struktur data matang yang wajib dihasilkan oleh AI
  const fullScript = {
    metadata: { topic, duration, language, generatedAt: new Date().toISOString() },
    hook: {
      time: "00:00 - 00:03",
      vo: `Tahukah kamu? Ada rahasia mengejutkan di ${topic} yang bakal bikin kamu melongo!`,
      visualPrompt: "Close up, dramatic lighting, Roblox character with shocked expression, 9:16 aspect ratio"
    },
    scenes: [
      {
        timestamp: "00:03 - 00:15",
        vo: "Banyak yang mengira map ini biasa saja, tapi ternyata ada sesuatu di balik dinding ini.",
        visualPrompt: "High contrast gameplay of " + topic + ", cinematic dark green aesthetic, sharp focus"
      },
      {
        timestamp: "00:15 - 00:30",
        vo: "Sebelum kita lanjut ke rahasia utamanya, jangan lupa subscribe, like, dan share video ini supaya kamu nggak ketinggalan update terbaru lainnya!",
        visualPrompt: "Overlay text 'Subscribe & Like', cinematic camera movement inside Roblox map"
      }
      // Anda bisa menambahkan hingga ratusan scene sesuai durasi
    ]
  };

  return NextResponse.json(fullScript);
}