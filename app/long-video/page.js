"use client";

import React, { useState } from "react";

export default function LongVideoCreator() {
  const [formData, setFormData] = useState({ topic: "Misteri Game Roblox Paling Horor", duration: "10 Menit", language: "Indonesia" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const generateFullScript = async () => {
    setLoading(true);
    setErrorMsg("");
    setResult(null);

    try {
      const response = await fetch("/api/roblox/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: formData.topic,
          duration: formData.duration,
          language: formData.language,
          style: `ABSOLUTE RULE: You are a professional Video Director. Create a full, mature video script. MUST return ONLY a valid JSON object. 
          Format JSON yang WAJIB digunakan:
          {
            "hook": {
              "time": "00:00 - 00:05",
              "vo": "(Teks Voice Over 3 detik pertama WAJIB kalimat tanya yang bikin penasaran)",
              "visualPrompt": "(Instruksi visual sangat detail, rasio 9:16)"
            },
            "scenes": [
              {
                "timestamp": "00:05 - 00:15",
                "vo": "(Teks narasi untuk scene ini)",
                "visualPrompt": "(Instruksi visual detail)"
              }
            ]
          }`
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal memproses AI");

      let rawData = data.result || data.raw || data;
      let finalParsed = rawData;

      let searchString = typeof rawData === "string" ? rawData : JSON.stringify(rawData);
      try {
        const match = searchString.match(/\{[\s\S]*\}/);
        if (match) {
          finalParsed = JSON.parse(match[0]);
        }
      } catch (e) {
        console.log("Bukan format JSON ketat, menampilkan apa adanya.");
      }

      setResult(finalParsed);
    } catch (e) {
      setErrorMsg("Gagal meracik Naskah: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // LOGIKA AMAN UNTUK VERCEL (Mencegah Error Turbopack)
  let hookData = null;
  let scenesData = [];
  let isStandardFormat = false;

  if (result) {
    if (result.hook) {
      hookData = result.hook;
      scenesData = result.scenes || [];
      isStandardFormat = true;
    } else if (result.script && result.script.hook) {
      hookData = result.script.hook;
      scenesData = result.script.scenes || [];
      isStandardFormat = true;
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-green-500 mb-2">Sutradara AI: Produksi Full Video (Real AI)</h1>
        
        <div className="bg-gray-900 p-6 rounded-xl border border-green-800 space-y-4">
          <input
            className="w-full p-4 bg-gray-800 rounded border border-gray-700 text-white focus:border-green-500 outline-none"
            placeholder="Ketik Topik (Contoh: Rahasia item gratis di Brookhaven)"
            value={formData.topic}
            onChange={(e) => setFormData({...formData, topic: e.target.value})}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <select className="p-4 bg-gray-800 rounded border border-gray-700 text-white outline-none" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})}>
              <option value="5 Menit">5 Menit</option><option value="10 Menit">10 Menit</option><option value="20 Menit">20 Menit</option>
            </select>
            <select className="p-4 bg-gray-800 rounded border border-gray-700 text-white outline-none" value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})}>
              <option value="Indonesia">Indonesia</option><option value="English">English</option>
            </select>
          </div>
          
          <button className="w-full bg-green-600 hover:bg-green-500 py-4 rounded font-bold text-lg transition-all flex justify-center items-center" onClick={generateFullScript} disabled={loading}>
            {loading ? "⏳ AI Sedang Bekerja Keras... (Tunggu Sekitar 10-20 Detik)" : "🎬 Generate Naskah Matang"}
          </button>
          
          {errorMsg && <div className="p-4 bg-red-900/50 border border-red-500 text-white rounded mt-4">{errorMsg}</div>}
        </div>

        {/* AREA HASIL: RAPI & BEBAS ERROR */}
        {result && (
          <div className="mt-8 space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-green-400 border-b border-green-900 pb-2">Hasil Sutradara AI:</h2>

            {isStandardFormat && hookData ? (
              <>
                <div className="bg-gray-900 p-6 rounded-xl border-l-4 border-red-500 shadow-lg">
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-xs font-bold uppercase">Hook 3 Detik Pertama</span>
                  <p className="text-sm text-gray-400 font-bold mt-4 mb-2">⏱️ {hookData.time || "00:00 - 00:05"}</p>
                  <p className="text-xl font-bold text-white mb-4">🎙️ VO: "{hookData.vo}"</p>
                  <div className="bg-black/50 p-3 rounded border border-gray-800">
                    <p className="text-sm italic text-green-400">🖼️ Visual: {hookData.visualPrompt || hookData.visual || "-"}</p>
                  </div>
                </div>

                {scenesData && scenesData.length > 0 && scenesData.map((scene, i) => (
                  <div key={i} className="bg-gray-900 p-6 rounded-xl border-l-4 border-blue-500 shadow-lg">
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold uppercase">Scene {i + 1}</span>
                    <p className="text-sm text-gray-400 font-bold mt-4 mb-2">⏱️ {scene.timestamp || scene.time || "-"}</p>
                    <p className="text-lg text-white mb-4">🎙️ VO: "{scene.vo}"</p>
                    <div className="bg-black/50 p-3 rounded border border-gray-800">
                      <p className="text-sm italic text-green-400">🖼️ Visual: {scene.visualPrompt || scene.visual || "-"}</p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="bg-gray-900 p-6 rounded-xl border border-yellow-600 shadow-lg">
                <p className="text-yellow-400 text-sm mb-4">⚠️ AI memberikan format alternatif, ini adalah hasil mentahnya:</p>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}