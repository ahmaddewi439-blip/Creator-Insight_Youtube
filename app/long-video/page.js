"use client";
import { useState } from 'react';

export default function LongVideoCreator() {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("10");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roblox/generate-long', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, duration, language })
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      alert("Gagal terhubung ke server!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto bg-gray-900 p-8 rounded-xl shadow-2xl border border-green-800">
        <h1 className="text-3xl font-extrabold text-green-500 mb-2">Sutradara AI: Video Panjang</h1>
        <p className="text-gray-400 mb-8 text-sm">Blueprint Naskah, Gameplay Roblox dan Arahan Visual Detik per Detik</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-300">Ide / Misteri Roblox</label>
            <input type="text" className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-green-500 outline-none text-white" placeholder="Contoh: Rahasia DOORS..." value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-300">Durasi (Menit)</label>
            <select className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-green-500 outline-none text-white" value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="5">5 Menit</option><option value="10">10 Menit</option><option value="15">15 Menit</option><option value="20">20+ Menit</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-300">Bahasa</label>
            <select className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-green-500 outline-none text-white" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="English">English (Global)</option><option value="Indonesian">Bahasa Indonesia</option>
            </select>
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading || !topic} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-4 rounded-lg">
          {loading ? "Menyusun Blueprint Visual..." : "Buat Naskah Sekarang"}
        </button>

        {result && (
          <div className="mt-10 p-6 bg-gray-950 rounded-lg border border-green-900/50">
            <h2 className="text-xl font-bold text-green-400 mb-4">Hasil Generate:</h2>
            <pre className="text-xs text-green-300 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}