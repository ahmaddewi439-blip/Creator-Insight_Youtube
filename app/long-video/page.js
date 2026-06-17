"use client";
import { useState } from 'react';

export default function LongVideoCreator() {
  const [formData, setFormData] = useState({ topic: "Roblox Update", duration: "10", language: "Indonesia" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generateFullScript = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-full-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      setResult(data);
    } catch (e) {
      alert("Gagal memanggil API. Pastikan endpoint API tersedia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <h1 className="text-3xl font-bold text-green-500 mb-6">Sutradara AI: Produksi Full Video</h1>
      <div className="bg-gray-900 p-6 rounded-xl border border-green-800 space-y-4">
        <select className="w-full p-3 bg-gray-800 rounded" onChange={(e) => setFormData({...formData, topic: e.target.value})}>
          {["Roblox Update", "Misteri Map Horor", "Tips & Trik Pro", "Bocoran Item Gratis"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-4">
          <select className="p-3 bg-gray-800 rounded" onChange={(e) => setFormData({...formData, duration: e.target.value})}>
            <option value="5">5 Menit</option><option value="10">10 Menit</option><option value="20">20 Menit</option>
          </select>
          <select className="p-3 bg-gray-800 rounded" onChange={(e) => setFormData({...formData, language: e.target.value})}>
            <option value="Indonesia">Indonesia</option><option value="English">English</option>
          </select>
        </div>
        <button className="w-full bg-green-600 py-4 rounded font-bold text-lg" onClick={generateFullScript}>
          {loading ? "AI Sedang Menyusun Naskah..." : "Generate Naskah Matang"}
        </button>
      </div>

      {result && (
        <div className="mt-8 p-6 bg-gray-950 border border-green-900 rounded-lg">
          <h2 className="text-xl font-bold text-green-400 mb-4">Naskah Matang Final:</h2>
          <pre className="text-sm text-gray-200 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}