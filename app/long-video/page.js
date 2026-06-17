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
          style: "Buatkan naskah video YouTube yang sangat detail dengan hook kuat, voice over natural, arahan visual/gameplay, sfx, dan text on screen."
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
      } catch (e) {}

      setResult(finalParsed);
    } catch (e) {
      setErrorMsg("Gagal meracik Naskah: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // MENGAMBIL ARRAY SCENES DARI FORMAT AI ASLI ANDA
  let scenesList = [];
  if (result && result.scenes) {
    scenesList = result.scenes;
  } else if (result && result.script && result.script.scenes) {
    scenesList = result.script.scenes;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-green-500 mb-2">Sutradara AI: Produksi Full Video</h1>
        
        <div className="bg-gray-900 p-6 rounded-xl border border-green-800 space-y-4 shadow-lg">
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
            {loading ? "⏳ Menyusun Skrip, Arahan Visual & Prompt... (Tunggu 15 Detik)" : "🎬 Generate Naskah Matang Final"}
          </button>
          
          {errorMsg && <div className="p-4 bg-red-900/50 border border-red-500 text-white rounded mt-4">{errorMsg}</div>}
        </div>

        {/* AREA HASIL: MENAMPILKAN DATA DETAIL DARI API */}
        {result && (
          <div className="mt-8 space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-green-400 border-b border-green-900 pb-2">
              {result.videoTitle || "Blueprint Produksi Matang:"}
            </h2>

            {scenesList && scenesList.length > 0 ? (
              scenesList.map((scene, i) => {
                const isHook = i === 0;
                return (
                  <div key={i} className={`bg-gray-900 p-6 rounded-xl border-l-4 shadow-lg ${isHook ? 'border-red-500' : 'border-blue-500'}`}>
                    <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                      <span className={`${isHook ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'} px-3 py-1 rounded text-xs font-bold uppercase tracking-widest`}>
                        {scene.name || `Scene ${scene.scene || i + 1}`}
                      </span>
                      <span className="text-sm font-bold text-gray-400">⏱️ Detik: {scene.duration || scene.timestamp || scene.time || "-"}</span>
                    </div>
                    
                    <p className="text-lg text-white mb-4 leading-relaxed">
                      <span className="text-yellow-500 font-bold mr-2">🎙️ Voice Over:</span> 
                      "{scene.vo || scene.voiceOver}"
                    </p>

                    <div className="space-y-3 bg-black/60 p-4 rounded-lg border border-gray-800">
                      {scene.overlayText && (
                        <p className="text-sm text-pink-400"><span className="font-bold text-gray-500 uppercase tracking-wide text-xs">💬 Teks di Layar:</span><br/>{scene.overlayText}</p>
                      )}
                      {scene.gameplayDirection && (
                        <p className="text-sm text-blue-300"><span className="font-bold text-gray-500 uppercase tracking-wide text-xs">🎮 Arahan Gameplay:</span><br/>{scene.gameplayDirection}</p>
                      )}
                      {scene.editingDirection && (
                        <p className="text-sm text-purple-300"><span className="font-bold text-gray-500 uppercase tracking-wide text-xs">✂️ Editing & Efek:</span><br/>{scene.editingDirection} {scene.sfx ? `(+ Sound Effect: ${scene.sfx})` : ''}</p>
                      )}
                      {scene.imagePrompts && scene.imagePrompts.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-800">
                          <p className="text-sm italic text-green-400"><span className="font-bold text-gray-500 uppercase tracking-wide text-xs not-italic">🖼️ Prompt AI Image (9:16):</span><br/>{scene.imagePrompts.join(" | ")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="bg-gray-900 p-6 rounded-xl border border-yellow-600 shadow-lg">
                <p className="text-yellow-400 text-sm mb-4">⚠️ Format JSON tidak terduga, ini hasil mentahnya:</p>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}