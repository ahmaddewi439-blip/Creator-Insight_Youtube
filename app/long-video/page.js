"use client";
import { useState } from 'react';

export default function LongVideoCreator() {
  const [formData, setFormData] = useState({ 
    topic: "Roblox Update", 
    duration: "10", 
    language: "Indonesia" 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const topics = [
    "Roblox Update", 
    "Misteri Map Horor", 
    "Tips & Trik Pro", 
    "Bocoran Item Gratis", 
    "Review Game Viral"
  ];

  const generateViralScript = () => {
    setLoading(true);
    setTimeout(() => {
      setResult({
        title: `${formData.topic} - Edisi ${formData.duration} Menit`,
        hook: `Tahukah kamu? Ada sesuatu yang gila banget di ${formData.topic} yang baru saja rilis!`,
        content: `Pembahasan mendalam tentang ${formData.topic} dalam bahasa ${formData.language} untuk durasi ${formData.duration} menit.`,
        cta: "Jangan lupa subscribe, like, dan share video ini supaya kamu nggak ketinggalan update terbaru lainnya!",
        closing: "Terima kasih sudah menonton!"
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-green-500">Sutradara AI: Naskah Viral</h1>
        
        <div className="bg-gray-900 p-6 rounded-xl border border-green-800 space-y-4">
          {/* Menu Dropdown Topik */}
          <select className="w-full p-3 bg-gray-800 rounded" onChange={(e) => setFormData({...formData, topic: e.target.value})}>
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <select className="p-3 bg-gray-800 rounded" onChange={(e) => setFormData({...formData, duration: e.target.value})}>
              <option value="5">5 Menit</option>
              <option value="10">10 Menit</option>
              <option value="20">20 Menit</option>
            </select>
            <select className="p-3 bg-gray-800 rounded" onChange={(e) => setFormData({...formData, language: e.target.value})}>
              <option value="Indonesia">Indonesia</option>
              <option value="English">English</option>
            </select>
          </div>

          <button className="w-full bg-green-600 py-3 rounded font-bold" onClick={generateViralScript}>
            {loading ? "Meracik Hook & CTA..." : "Generate Naskah Viral"}
          </button>
        </div>

        {result && (
          <div className="mt-8 bg-black p-6 rounded border border-green-900 animate-fadeIn">
            <h2 className="text-green-400 font-bold mb-2">3 Detik Pertama (Hook):</h2>
            <p className="text-white italic text-lg mb-4">"{result.hook}"</p>
            
            <h2 className="text-green-400 font-bold mb-2">Ajakan (Interaksi):</h2>
            <p className="text-yellow-400 font-semibold mb-4">{result.cta}</p>
            
            <h2 className="text-green-400 font-bold mb-2">Detail Produksi:</h2>
            <p className="text-gray-300">Topik: {result.title}</p>
            <p className="text-gray-300">Isi: {result.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}