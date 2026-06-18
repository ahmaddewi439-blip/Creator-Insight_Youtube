"use client";

import React, { useState } from "react";

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className={`text-xs px-3 py-1 rounded font-bold transition-all flex items-center gap-1 border ${copied ? "bg-green-600 border-green-500 text-white" : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"}`}>
      {copied ? "✓ Tersalin!" : `📋 ${label}`}
    </button>
  );
}

export default function LongVideoCreator() {
  const [formData, setFormData] = useState({ topic: "Misteri Game Roblox Paling Horor", duration: "5 Menit", language: "English" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const generateFullScript = async () => {
    setLoading(true);
    setErrorMsg("");
    setResult(null);

    try {
      const response = await fetch("/api/ai/director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal memproses AI");
      setResult(data.result || data.raw || data);
    } catch (e) {
      setErrorMsg("Gagal meracik Naskah: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  let scenesList = result?.scenes || result?.script?.scenes || [];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-green-500 mb-2">Sutradara AI: Produksi Full Video (Slide-by-Slide)</h1>
        
        <div className="bg-gray-900 p-6 rounded-xl border border-green-800 space-y-4 shadow-lg">
          <input
            className="w-full p-4 bg-gray-800 rounded border border-gray-700 text-white focus:border-green-500 outline-none"
            placeholder="Ketik Topik (Contoh: Rahasia item gratis di Brookhaven)"
            value={formData.topic}
            onChange={(e) => setFormData({...formData, topic: e.target.value})}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <select className="p-4 bg-gray-800 rounded border border-gray-700 text-white outline-none" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})}>
              <option value="5 Menit">5 Menit</option>
              <option value="10 Menit">10 Menit</option>
              <option value="20 Menit">20 Menit</option>
            </select>
            <select className="p-4 bg-gray-800 rounded border border-gray-700 text-white outline-none" value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})}>
              <option value="English">English</option>
              <option value="Indonesia">Indonesia</option>
            </select>
          </div>
          
          <button className="w-full bg-green-600 hover:bg-green-500 py-4 rounded font-bold text-lg transition-all flex justify-center items-center" onClick={generateFullScript} disabled={loading}>
            {loading ? "⏳ AI Sedang Menulis Ribuan Kata... (Tunggu 20-40 Detik)" : "🎬 Generate Naskah Matang Final"}
          </button>
          
          {errorMsg && <div className="p-4 bg-red-900/50 border border-red-500 text-white rounded mt-4">{errorMsg}</div>}
        </div>

        {result && (
          <div className="mt-8 space-y-6 animate-fadeIn">
            <div className="flex justify-between items-end border-b border-green-900 pb-2">
              <h2 className="text-2xl font-bold text-green-400">
                {result.videoTitle || "Blueprint Video Panjang:"}
              </h2>
              
              <CopyButton text="{JSON.stringify(result," null, 2)} label="Copy Semua (JSON)"/>
            </div>

            {scenesList.length > 0 ? (
              scenesList.map((scene, i) => (
                <div key={i} className="bg-gray-900 p-6 rounded-xl border-l-4 border-blue-500 shadow-lg relative">
                  <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-2">
                    <div>
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">
                        {scene.name || `Scene ${scene.scene || i + 1}`}
                      </span>
                      <p className="text-sm font-bold text-gray-400 mt-2">⏱️ Waktu VO: {scene.duration || scene.time || "-"}</p>
                    </div>
                    
                    <CopyButton text="{scene.vo" || scene.voiceOver} label="Copy Naskah VO"/>
                  </div>
                  
                  <p className="text-lg text-white mb-6 leading-relaxed">
                    <span className="text-yellow-500 font-bold mr-2">🎙️ Voice Over:</span> 
                    "{scene.vo || scene.voiceOver}"
                  </p>

                  <div className="space-y-3 bg-black/60 p-4 rounded-lg border border-gray-800 mt-4">
                    <p className="font-bold text-gray-400 uppercase tracking-wide text-xs mb-3 border-b border-gray-700 pb-2">📸 Slide-by-Slide Visual (16:9):</p>
                    
                    {scene.visuals && scene.visuals.length > 0 ? (
                      scene.visuals.map((vis, vIdx) => (
                        <div key={vIdx} className="flex justify-between items-start border-b border-gray-700/50 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0 hover:bg-gray-800/50 p-2 rounded transition-colors">
                          <div className="w-5/6 pr-4">
                            <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded mr-2 border border-yellow-500/20">⏱️ {vis.time}</span>
                            <p className="text-sm italic text-green-400 mt-2 leading-relaxed">{vis.prompt}</p>
                          </div>
                          
                          <CopyButton text="{vis.prompt}" label="Copy Prompt"/>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">Format slide-by-slide tidak tersedia untuk scene ini.</p>
                    )}

                    {scene.editingDirection && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-sm text-purple-300">
                          <span className="font-bold text-gray-500 uppercase tracking-wide text-xs">✂️ Cara Edit:</span><br/>{scene.editingDirection}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
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