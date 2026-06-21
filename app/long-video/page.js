"use client";
import { useState, useEffect } from "react";

export default function LongVideoPage() {
  const [targetTopic, setTargetTopic] = useState("");
  const [targetNiche, setTargetNiche] = useState("");
  const [duration, setDuration] = useState("5 Menit");
  const [language, setLanguage] = useState("Indonesia");
  const [isGenerating, setIsGenerating] = useState(false);

  // Menyedot memori "Angle" yang dipilih user dari halaman sebelumnya
  useEffect(() => {
    setTargetTopic(localStorage.getItem("targetTopic") || "");
    setTargetNiche(localStorage.getItem("targetNiche") || "");
  }, []);

  const handleGenerateLongVideo = () => {
    setIsGenerating(true);
    // Nanti di sini kita sambungkan ke API Pembuat Naskah Long Video
    setTimeout(() => {
      alert("Sistem siap meracik naskah untuk: " + targetTopic);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <h1 style={{ color: '#f8fafc', fontSize: '24px', margin: 0 }}>🎬 Sutradara AI (Long Video)</h1>
          <button onClick={() => window.location.href='/'} style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            🔙 Kembali
          </button>
        </div>

        {/* Dashboard Card */}
        <div style={{ background: '#1e293b', border: '1px solid #10b981', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          
          {/* Kotak Info Target Otomatis */}
          <div style={{ marginBottom: '24px', background: '#064e3b', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
            <p style={{ margin: '0 0 8px 0', color: '#a7f3d0', fontSize: '13px', fontWeight: 'bold' }}>🎯 Angle Terpilih (Otomatis dari Radar):</p>
            <h2 style={{ margin: 0, color: '#34d399', fontSize: '22px', lineHeight: '1.4' }}>"{targetTopic || "Belum ada topik terpilih"}"</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {/* Input Durasi */}
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>⏳ Durasi Video:</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#0f172a', color: 'white', border: '1px solid #334155', outline: 'none', cursor: 'pointer' }}>
                <option value="5 Menit">5 Menit (Standar Retensi)</option>
                <option value="10 Menit">10 Menit (Monetisasi Ekstra)</option>
                <option value="15 Menit">15 Menit (Dokumenter Panjang)</option>
              </select>
            </div>
            
            {/* Input Bahasa */}
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>🗣️ Bahasa Naskah:</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#0f172a', color: 'white', border: '1px solid #334155', outline: 'none', cursor: 'pointer' }}>
                <option value="Indonesia">Indonesia (Lokal)</option>
                <option value="English">English (Target Bule / RPM Tinggi)</option>
              </select>
            </div>
          </div>

          {/* Tombol Eksekusi */}
          <button 
            onClick={handleGenerateLongVideo} 
            disabled={isGenerating || !targetTopic}
            style={{ width: '100%', background: '#10b981', color: '#022c22', fontWeight: 'bold', padding: '18px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
          >
            {isGenerating ? '⏳ Menyusun Timeline & Prompt Visual...' : '🎬 Generate Naskah Matang Final'}
          </button>
        </div>

      </div>
    </div>
  );
}