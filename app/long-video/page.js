"use client";

import React, { useState } from "react";

export default function LongVideoCreator() {
  const [formData, setFormData] = useState({ topic: "Misteri Game Roblox Paling Horor", duration: "10", language: "Indonesia" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const generateFullScript = async () => {
    setLoading(true);
    setErrorMsg("");
    setResult(null);

    try {
      // Kita panggil API AI asli yang sudah eksis dan berfungsi di Vercel Anda!
      const response = await fetch("/api/ai/optimize-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video: null,
          videoFormat: "Long",
          duration: `${formData.duration} minutes`,
          language: formData.language,
          // Ini adalah "Otak" instruksinya agar keluar format produksi detail
          instruction: `ABSOLUTE RULE: You are a professional Video Director. Create a full, mature video script for YouTube based on this topic: "${formData.topic}". Language: ${formData.language}. Duration: ${formData.duration} minutes. You MUST return ONLY a valid JSON object. Do not wrap in markdown or backticks.
          Format JSON yang WAJIB digunakan:
          {
            "hook": {
              "time": "00:00 - 00:05",
              "vo": "(Teks Voice Over 3 detik pertama WAJIB kalimat tanya yang bikin penasaran tingkat tinggi)",
              "visualPrompt": "(Instruksi visual/gambar sangat detail untuk detik ini, fokus visual yang mencolok)"
            },
            "scenes": [
              {
                "timestamp": "00:05 - 00:15",
                "vo": "(Teks narasi untuk scene ini)",
                "visualPrompt": "(Instruksi visual/gameplay detail)"
              }
            ]
          }
          Buat minimal 5-7 scene yang terstruktur rapi sampai akhir video. Sisipkan CTA (Subscribe/Like/Share) di pertengahan video.`
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal memproses AI");

      // Membersihkan teks jika AI menyelipkan karakter tambahan (markdown)
      let finalData = data.result || data.raw || data;
      if (typeof finalData === "string") {
        const match = finalData.match(/\{[\s\S]*\}/);
        if (match) finalData = JSON.parse(match[0]);
      }

      setResult(finalData);
    } catch (e) {
      setErrorMsg("Gagal meracik Naskah: " + e.message + " (Pastikan OpenAI/Gemini API key aktif)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-green-500 mb-2">Sutradara AI: Produksi Full Video (Real AI)</h1>
        
        <div className="bg-gray-900 p-6 rounded-xl border border-green-800 space-y-4">
          <p className="text-gray-400 text-sm mb-2">Ketikan ide konten Anda. AI akan menyusun *Hook*, Naskah *Voice Over*, dan Instruksi Visual/Gambar secara terperinci detik per detiknya.</p>
          
          <input
            className="w-full p-4 bg-gray-800 rounded border border-gray-700 text-white focus:border-green-500 outline-none"
            placeholder="Ketik Topik (Contoh: Rahasia item gratis di Brookhaven)"
            value={formData.topic}
            onChange={(e) => setFormData({...formData, topic: e.target.value})}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <select className="p-4 bg-gray-800 rounded border border-gray-700 text-white outline-none" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})}>
              <option value="5">5 Menit</option><option value="10">10 Menit</option><option value="20">20 Menit</option>
            </select>
            <select className="p-4 bg-gray-800 rounded border border-gray-700 text-white outline-none" value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})}>
              <option value="Indonesia">Indonesia</option><option value="English">English</option>
            </select>
          </div>
          
          <button className="w-full bg-green-600 hover:bg-green-500 py-4 rounded font-bold text-lg transition-all" onClick={generateFullScript} disabled={loading}>
            {loading ? "⏳ AI Sedang Menulis Skrip & Merancang Visual..." : "🎬 Generate Naskah Matang (Proses AI Asli)"}
          </button>
          
          {errorMsg && <div className="p-4 bg-red-900/50 border border-red-500 text-white rounded mt-4">{errorMsg}</div>}
        </div>

        {/* AREA HASIL BLUEPRINT YANG MATANG */}
        {result && result.hook && (
          <div className="mt-8 space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-green-400 border-b border-green-900 pb-2">Blueprint Produksi (Hasil AI Langsung):</h2>
            
            <div className="bg-gray-900 p-6 rounded-xl border-l-4 border-red-500 shadow-lg">
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Hook 3 Detik Pertama</span>
              <p className="text-sm text-gray-400 font-bold mt-4 mb-2">⏱️ {result.hook.time}</p>
              <p className="text-xl font-bold text-white mb-4 leading-relaxed">🎙️ VO: "{result.hook.vo}"</p>
              <div className="bg-black/50 p-3 rounded">
                <p className="text-sm italic text-green-400">🖼️ Visual Prompt: {result.hook.visualPrompt}</p>
              </div>
            </div>

            {result.scenes && result.scenes.map((scene, i) => (
              <div key={i} className="bg-gray-900 p-6 rounded-xl border-l-4 border-blue-500 shadow-lg">
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Scene {i + 1}</span>
                <p className="text-sm text-gray-400 font-bold mt-4 mb-2">⏱️ {scene.timestamp}</p>
                <p className="text-lg text-white mb-4 leading-relaxed">🎙️ VO: "{scene.vo}"</p>
                <div className="bg-black/50 p-3 rounded">
                  <p className="text-sm italic text-green-400">🖼️ Visual Prompt: {scene.visualPrompt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}