"use client";

import React, { useState } from "react";

// Komponen Tombol Copy Praktis
function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-3 py-1 rounded font-bold transition-all flex items-center gap-1 border ${
        copied ? "bg-green-600 border-green-500 text-white" : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
      }`}
    >
      {copied ? "✓ Tersalin!" : `📋 ${label}`}
    </button>
  );
}

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
          // PERINTAH MUTLAK: Paksa AI menggunakan satuan MENIT dan Rasio 16:9
          style: `CRITICAL INSTRUCTION: You are directing a LONG-FORM YouTube Video. Duration is EXACTLY ${formData.duration}. DO NOT write a 60-second Shorts script. 
          Timestamps MUST be in MINUTES (e.g., "00:00 - 02:00", "02:00 - 05:00"). 
          Aspect ratio MUST be 16:9 (Horizontal).
          Write a highly detailed, lengthy script to fill the ${formData.duration} duration.
          MUST return ONLY a valid JSON object.
          Format JSON:
          {
            "videoTitle": "Judul Clickbait Long Video",
            "hook": {
              "time": "00:00 - 01:00",
              "vo": "(Teks Voice Over 1 menit pertama yang mendalam)",
              "visualPrompt": "(Instruksi visual horizontal 16:9, sangat detail)",
              "editingDirection": "(Cara edit khusus)"
            },
            "scenes": [
              {
                "timestamp": "01:00 - 04:00",
                "vo": "(Teks narasi sangat detail, panjang, dan informatif)",
                "visualPrompt": "(Instruksi visual 16:9)",
                "editingDirection": "(Cara edit)"
              }
              // Buat banyak scene hingga durasi mencapai ${formData.duration}
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
        if (match) finalParsed = JSON.parse(match[0]);
      } catch (e) {}

      setResult(finalParsed);
    } catch (e) {
      setErrorMsg("Gagal meracik Naskah: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  let scenesList = [];
  if (result && result.scenes) {
    scenesList = result.scenes;
  } else if (result && result.script && result.script.scenes) {
    scenesList = result.script.scenes;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-green-500 mb-2">Sutradara AI: Produksi Full Video (Long Form)</h1>
        
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
              <option value="Indonesia">Indonesia</option>
              <option value="English">English</option>
            </select>
          </div>
          
          <button className="w-full bg-green-600 hover:bg-green-500 py-4 rounded font-bold text-lg transition-all flex justify-center items-center" onClick={generateFullScript} disabled={loading}>
            {loading ? "⏳ AI Sedang Menulis Naskah Video Panjang... (Bisa 20+ Detik)" : "🎬 Generate Naskah Matang Final"}
          </button>
          
          {errorMsg && <div className="p-4 bg-red-900/50 border border-red-500 text-white rounded mt-4">{errorMsg}</div>}
        </div>

        {/* AREA HASIL DENGAN TOMBOL COPY */}
        {result && (
          <div className="mt-8 space-y-6 animate-fadeIn">
            <div className="flex justify-between items-end border-b border-green-900 pb-2">
              <h2 className="text-2xl font-bold text-green-400">
                {result.videoTitle || "Blueprint Video Panjang:"}
              </h2>
              {/* Tombol Copy Seluruh Teks JSON */}
              <CopyButton text={JSON.stringify(result, null, 2)} label="Copy Semua (JSON)" />
            </div>

            {/* HOOK SECTION (JIKA ADA) */}
            {(result.hook || (result.script && result.script.hook)) && (() => {
              const hook = result.hook || result.script.hook;
              return (
                <div className="bg-gray-900 p-6 rounded-xl border-l-4 border-red-500 shadow-lg relative">
                  <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-2">
                    <div>
                      <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">Hook (Pembukaan)</span>
                      <p className="text-sm font-bold text-gray-400 mt-2">⏱️ Waktu: {hook.time || hook.timestamp || "00:00"}</p>
                    </div>
                    {/* Tombol Copy Khusus VO Hook */}
                    <CopyButton text={hook.vo || hook.voiceOver} label="Copy Naskah VO" />
                  </div>
                  
                  <p className="text-lg text-white mb-4 leading-relaxed">
                    <span className="text-yellow-500 font-bold mr-2">🎙️ Voice Over:</span> 
                    "{hook.vo || hook.voiceOver}"
                  </p>

                  <div className="space-y-3 bg-black/60 p-4 rounded-lg border border-gray-800">
                    <div className="flex justify-between items-start">
                      <p className="text-sm italic text-green-400 w-5/6">
                        <span className="font-bold text-gray-500 uppercase tracking-wide text-xs not-italic">🖼️ Arahan Visual (16:9):</span><br/>
                        {hook.visualPrompt || hook.visual || "-"}
                      </p>
                      <CopyButton text={hook.visualPrompt || hook.visual} label="Copy Prompt" />
                    </div>
                    {hook.editingDirection && (
                      <p className="text-sm text-purple-300 mt-2">
                        <span className="font-bold text-gray-500 uppercase tracking-wide text-xs">✂️ Cara Edit:</span><br/>{hook.editingDirection}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* SCENES SECTION */}
            {scenesList && scenesList.length > 0 ? (
              scenesList.map((scene, i) => (
                <div key={i} className="bg-gray-900 p-6 rounded-xl border-l-4 border-blue-500 shadow-lg relative">
                  <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-2">
                    <div>
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">
                        {scene.name || `Scene ${scene.scene || i + 1}`}
                      </span>
                      <p className="text-sm font-bold text-gray-400 mt-2">⏱️ Waktu: {scene.duration || scene.timestamp || scene.time || "-"}</p>
                    </div>
                    {/* Tombol Copy Khusus VO Scene ini */}
                    <CopyButton text={scene.vo || scene.voiceOver} label="Copy Naskah VO" />
                  </div>
                  
                  <p className="text-lg text-white mb-4 leading-relaxed">
                    <span className="text-yellow-500 font-bold mr-2">🎙️ Voice Over:</span> 
                    "{scene.vo || scene.voiceOver}"
                  </p>

                  <div className="space-y-3 bg-black/60 p-4 rounded-lg border border-gray-800">
                    <div className="flex justify-between items-start">
                      <p className="text-sm italic text-green-400 w-5/6">
                        <span className="font-bold text-gray-500 uppercase tracking-wide text-xs not-italic">🖼️ Arahan Visual (16:9):</span><br/>
                        {scene.visualPrompt || (scene.imagePrompts ? scene.imagePrompts.join(" | ") : "-")}
                      </p>
                      <CopyButton text={scene.visualPrompt || (scene.imagePrompts ? scene.imagePrompts.join(" | ") : "")} label="Copy Prompt" />
                    </div>
                    {scene.editingDirection && (
                      <p className="text-sm text-purple-300 mt-2">
                        <span className="font-bold text-gray-500 uppercase tracking-wide text-xs">✂️ Cara Edit:</span><br/>{scene.editingDirection}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-900 p-6 rounded-xl border border-yellow-600 shadow-lg">
                <div className="flex justify-between">
                  <p className="text-yellow-400 text-sm mb-4">⚠️ AI menggunakan format mentah:</p>
                  <CopyButton text={JSON.stringify(result, null, 2)} label="Copy Semua" />
                </div>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}