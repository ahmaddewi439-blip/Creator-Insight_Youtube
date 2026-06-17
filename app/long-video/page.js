"use client";
import { useState } from 'react';

export default function LongVideoCreator() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState(null);

  const generateLocal = () => {
    if (!topic) return;
    const blueprint = {
      title: `Rahasia Tersembunyi di ${topic}`,
      description: "Video ini mengungkap rahasia yang tidak diketahui banyak orang di Roblox!",
      hashtags: ["#roblox", "#gaming", "#trending"],
      fullVO: `Halo semuanya! Hari ini kita akan membahas rahasia di ${topic} yang bikin kalian kaget. Pertama, lihat ini...`,
      scenes: [
        { scene: 1, name: "Hook", duration: "0:05", vo: "Kalian tidak akan percaya apa yang saya temukan!", imagePrompts: ["Roblox character shocked expression 9:16"] },
        { scene: 2, name: "Gameplay", duration: "0:10", vo: "Pertama, lihat bagian ini...", imagePrompts: ["Roblox gameplay mystery scene 9:16"] }
      ]
    };
    setResult(blueprint);
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold text-green-500 mb-6">Sutradara AI: Video Panjang</h1>
      <div className="bg-gray-900 p-6 rounded-lg border border-green-800">
        <input 
          className="w-full p-3 bg-gray-800 rounded border border-gray-700 text-white mb-4" 
          placeholder="Masukkan Topik (Contoh: Doors Mystery)" 
          onChange={(e) => setTopic(e.target.value)} 
        />
        <button 
          className="w-full bg-green-600 hover:bg-green-500 py-3 rounded font-bold" 
          onClick={generateLocal}
        >
          Buat Blueprint Sekarang
        </button>
      </div>

      {result && (
        <div className="mt-8 bg-black p-6 rounded border border-green-900">
          <h2 className="text-green-400 font-bold mb-4">Hasil Blueprint (Siap Edit):</h2>
          <pre className="text-xs text-green-300 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}