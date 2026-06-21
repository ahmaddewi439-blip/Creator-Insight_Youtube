"use client";
import { useState, useEffect } from "react";

export default function LongVideoPage() {
  const [targetTopic, setTargetTopic] = useState("");
  const [targetNiche, setTargetNiche] = useState("");
  const [duration, setDuration] = useState("5 Menit");
  const [language, setLanguage] = useState("Indonesia");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [scriptData, setScriptData] = useState<any>(null);

  useEffect(() => {
    setTargetTopic(localStorage.getItem("targetTopic") || "");
    setTargetNiche(localStorage.getItem("targetNiche") || "");
  }, []);

  const handleGenerateLongVideo = async () => {
    setIsGenerating(true);
    setScriptData(null);
    setLoadingStep(1);

    // Animasi Loading Menurun
    setTimeout(() => setLoadingStep(2), 2000); 
    setTimeout(() => setLoadingStep(3), 5000); 
    setTimeout(() => setLoadingStep(4), 9000); 

    try {
      const res = await fetch('/api/ai/long-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: targetNiche, topic: targetTopic, duration, language })
      });
      const data = await res.json();
      if (data.success) {
        setLoadingStep(5);
        setScriptData(data.result);
      } else {
        alert("Gagal meracik naskah. Coba lagi.");
      }
    } catch (error) {
      console.error(error);
      alert("Error menghubungi server Sutradara AI.");
    }
    setIsGenerating(false);
  };

  const handleCopyAll = () => {
    if (!scriptData) return;
    let fullText = `JUDUL: ${scriptData.title}\nDESKRIPSI: ${scriptData.description}\nTAGS: ${scriptData.tags}\n\n=== NASKAH VIDEO ===\n\n`;
    scriptData.scenes.forEach((s: any, i: number) => {
      fullText += `SCENE ${i + 1} [${s.waktu}]\n🎥 VISUAL: ${s.visual}\n🎙️ VO: ${s.vo}\n🎨 PROMPT AI: ${s.prompt}\n\n`;
    });
    navigator.clipboard.writeText(fullText);
    alert("✅ Seluruh naskah & prompt berhasil disalin!");
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spinner { display: inline-block; animation: spin 1s linear infinite; }
        .vidiq-step { color: #94a3b8; font-size: 15px; margin: 12px 0; display: flex; align-items: center; gap: 10px; }
        .vidiq-step.done { color: #10b981; font-weight: bold; }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <h1 style={{ color: '#f8fafc', fontSize: '24px', margin: 0 }}>🎬 Sutradara AI (Long Video)</h1>
          <button onClick={() => window.location.href='/'} style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            🔙 Kembali
          </button>
        </div>

        {/* Kotak Kontrol Utama */}
        {!scriptData && (
          <div style={{ background: '#1e293b', border: '1px solid #10b981', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ marginBottom: '24px', background: '#064e3b', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
              <p style={{ margin: '0 0 8px 0', color: '#a7f3d0', fontSize: '13px', fontWeight: 'bold' }}>🎯 Angle Terpilih (Otomatis dari Radar):</p>
              <h2 style={{ margin: 0, color: '#34d399', fontSize: '22px', lineHeight: '1.4' }}>"{targetTopic || "Belum ada topik terpilih"}"</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>⏳ Durasi Video:</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#0f172a', color: 'white', border: '1px solid #334155', outline: 'none' }}>
                  <option value="5 Menit">5 Menit (Standar Retensi)</option>
                  <option value="10 Menit">10 Menit (Monetisasi Ekstra)</option>
                  <option value="15 Menit">15 Menit (Dokumenter Panjang)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>🗣️ Bahasa Naskah:</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#0f172a', color: 'white', border: '1px solid #334155', outline: 'none' }}>
                  <option value="Indonesia">🇮🇩 Indonesia (Lokal)</option>
                  <option value="English">🇺🇸 English (Target Bule / RPM Tinggi)</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleGenerateLongVideo} 
              disabled={isGenerating || !targetTopic}
              style={{ width: '100%', background: '#10b981', color: '#022c22', fontWeight: 'bold', padding: '18px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: isGenerating ? 0.7 : 1 }}
            >
              {isGenerating ? '⏳ Mesin AI Sedang Bekerja...' : '🎬 Generate Naskah Matang Final'}
            </button>
          </div>
        )}

        {/* AREA LOADING MENURUN */}
        {isGenerating && (
          <div style={{ background: '#020617', padding: '30px', borderRadius: '16px', border: '1px solid #10b981', marginTop: '20px' }}>
            <h3 style={{ color: '#34d399', marginBottom: '20px' }}>⚙️ Menyusun Dokumenter Level Netflix...</h3>
            <div className={loadingStep >= 1 ? "vidiq-step done" : "vidiq-step"}>{loadingStep > 1 ? "✓" : <span className="spinner">⏳</span>} Menganalisa struktur penulisan hook...</div>
            {loadingStep >= 2 && <div className={loadingStep >= 2 ? "vidiq-step done" : "vidiq-step"}>{loadingStep > 2 ? "✓" : <span className="spinner">⏳</span>} Membagi porsi timeline adegan per adegan...</div>}
            {loadingStep >= 3 && <div className={loadingStep >= 3 ? "vidiq-step done" : "vidiq-step"}>{loadingStep > 3 ? "✓" : <span className="spinner">⏳</span>} Menulis narasi Voice Over memikat dalam bahasa {language}...</div>}
            {loadingStep >= 4 && <div className={loadingStep >= 4 ? "vidiq-step done" : "vidiq-step"}>{loadingStep > 4 ? "✓" : <span className="spinner">⏳</span>} Meracik algoritma Prompt Visual (Midjourney/Bing)...</div>}
          </div>
        )}

        {/* AREA HASIL SCRIPT LONG VIDEO */}
        {scriptData && !isGenerating && (
          <div style={{ marginTop: '20px', animation: 'fadeIn 0.5s ease-in' }}>
            
            {/* Header Hasil */}
            <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #10b981', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ color: '#f8fafc', margin: '0 0 12px 0', fontSize: '22px' }}>{scriptData.title}</h2>
                  <p style={{ color: '#94a3b8', margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.6' }}>{scriptData.description}</p>
                  <p style={{ color: '#34d399', margin: 0, fontSize: '13px' }}>🏷️ {scriptData.tags}</p>
                </div>
                <button onClick={handleCopyAll} style={{ background: '#10b981', color: '#022c22', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: '20px' }}>
                  📋 Copy Full Naskah
                </button>
              </div>
            </div>

            {/* Timeline Scenes */}
            <h3 style={{ color: '#f8fafc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>🎞️ Timeline Director (Scene-by-Scene)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {scriptData.scenes.map((scene: any, idx: number) => (
                <div key={idx} style={{ background: '#020617', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
                  
                  {/* Scene Header */}
                  <div style={{ background: '#1e293b', padding: '12px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>Scene {idx + 1}</span>
                    <span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 'bold' }}>⏳ {scene.waktu}</span>
                  </div>

                  <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    
                    {/* Kolom Visual & Prompt */}
                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ color: '#94a3b8', display: 'block', fontSize: '13px', marginBottom: '6px' }}>🎥 VISUAL B-ROLL:</strong>
                        <p style={{ margin: 0, color: '#f8fafc', fontSize: '14px', lineHeight: '1.5' }}>{scene.visual}</p>
                      </div>
                      <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #c084fc' }}>
                        <strong style={{ color: '#c084fc', display: 'block', fontSize: '12px', marginBottom: '6px' }}>🎨 AI IMAGE PROMPT (Inggris):</strong>
                        <code style={{ color: '#e2e8f0', fontSize: '13px', display: 'block', whiteSpace: 'pre-wrap' }}>{scene.prompt}</code>
                      </div>
                    </div>

                    {/* Kolom Voice Over */}
                    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                      <strong style={{ color: '#34d399', display: 'block', fontSize: '13px', marginBottom: '12px' }}>🎙️ SCRIPT VOICE OVER ({language}):</strong>
                      <p style={{ margin: 0, color: '#f8fafc', fontSize: '16px', fontStyle: 'italic', lineHeight: '1.6' }}>"{scene.vo}"</p>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setScriptData(null)} style={{ marginTop: '30px', width: '100%', background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
              🔄 Buat Naskah Baru
            </button>

          </div>
        )}
      </div>
    </div>
  );
}