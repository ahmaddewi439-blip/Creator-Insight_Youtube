import React, { useState } from "react";

const RobloxCreatorFinalUI = () => {
  const [updateData, setUpdateData] = useState<any>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [generatingScriptIds, setGeneratingScriptIds] = useState<Record<number, boolean>>({});
  const [generatedScripts, setGeneratedScripts] = useState<Record<number, any>>({});
  
  const [selectedCategory, setSelectedCategory] = useState("natural-news");
  const [searchKeyword, setSearchKeyword] = useState("Roblox");
  const [language, setLanguage] = useState("id");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleSearchUpdate = async () => {
    try {
      setLoadingSearch(true);
      setGeneratedScripts({}); 
      
      const response = await fetch(
        `/api/search-roblox-update?keyword=${encodeURIComponent(
          searchKeyword
        )}&category=${encodeURIComponent(selectedCategory)}`
      );
      const data = await response.json();
      
      if (!data.success) {
        alert(data.error || "Gagal mengambil data Roblox dari Tavily.");
        return;
      }

      setUpdateData(data);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleGenerateAIScript = async (topic: any, index: number) => {
    try {
      setGeneratingScriptIds((prev) => ({ ...prev, [index]: true }));
      setExpandedIndex(index);
      
      // Instruksi Super Ketat untuk AI (Script + Algoritma YouTube)
      const strictStyle = `${selectedCategory}. WAJIB: Buat 5 scene. Scene 1 harus punya Hook kuat di 0-3 detik pertama. Scene 5 harus ada Call To Action (komen, like, subscribe). Setiap scene wajib punya 2 imagePrompts yang berbeda. Beri timestamp di tiap scene. 
      SELAIN ITU, bertindaklah sebagai Pakar Algoritma YouTube Shorts. Tambahkan metadata SEO-friendly di JSON dengan key: 
      1. "youtubeTitle": Judul sangat clickbait, memancing rasa penasaran ekstrim, maksimal 60 karakter. 
      2. "youtubeDescription": Deskripsi singkat 2 baris yang mengandung keyword pencarian tinggi terkait topik. 
      3. "youtubeHashtags": Array berisi 5-7 hashtag paling viral dan relevan (contoh: #roblox #robloxshorts dll). 
      Target bahasa: ${language === 'en' ? 'English' : 'Indonesian'}.`;

      const response = await fetch("/api/roblox/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: topic, 
          language: language === 'en' ? 'English' : 'Indonesian', 
          duration: "60 seconds", 
          style: strictStyle 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "AI Gagal memproses script.");
      }

      setGeneratedScripts((prev) => ({ ...prev, [index]: data.result || data.raw }));
    } catch (error: any) {
      alert(`Error AI: ${error.message}`);
    } finally {
      setGeneratingScriptIds((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleCopyFullVO = (scenes: any[], index: number) => {
    const fullVO = scenes.map(s => s.vo || s.voiceOver || s.voice_over).join(" ");
    handleCopy(fullVO, `full-vo-${index}`);
  };

  return (
    <div style={{ padding: '20px 0', maxWidth: '850px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#1f2937' }}>
      
      {/* --- INPUT & FILTER --- */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Input keyword..." 
          style={{ flex: 1, minWidth: '180px', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '15px' }}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <select 
          style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '15px', backgroundColor: '#fff', cursor: 'pointer' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="natural-news">Natural News</option>
          <option value="excited-gaming">Excited Gaming</option>
          <option value="mystery">Mystery</option>
          <option value="fun-facts">Fun Facts</option>
        </select>
        <select 
          style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '15px', backgroundColor: '#fff', cursor: 'pointer' }}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="id">Indonesian (ID)</option>
          <option value="en">English (EN)</option>
        </select>
        <button 
          onClick={handleSearchUpdate}
          disabled={loadingSearch}
          style={{ padding: '14px 24px', borderRadius: '12px', backgroundColor: loadingSearch ? '#ccc' : '#000', color: '#fff', border: 'none', fontWeight: '600', cursor: loadingSearch ? 'not-allowed' : 'pointer', fontSize: '15px' }}
        >
          {loadingSearch ? "Mencari di Tavily..." : "Search Update"}
        </button>
      </div>

      {/* --- HASIL PENCARIAN & AI SCRIPT --- */}
      {updateData && updateData.sources && updateData.sources.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {updateData.sources.map((item: any, index: number) => {
            const aiScript = generatedScripts[index];
            const isGenerating = generatingScriptIds[index];

            return (
              <div key={index} style={{ backgroundColor: '#f0f4f9', borderRadius: '24px', padding: '24px' }}>
                
                {/* JUDUL BERITA */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontWeight: '800', fontSize: '20px', color: '#111', lineHeight: '1.4' }}>📰 {item.title}</span>
                </div>

                {/* DATA INFO LENGKAP */}
                <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                  <strong style={{ fontSize: '14px', color: '#111', marginBottom: '8px', display: 'block' }}>ℹ️ Data Real-Time Tavily:</strong>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#555', lineHeight: '1.8' }}>
                    - <strong>Tanggal Update:</strong> {item.dateFetched || "-"}<br/>
                    - <strong>Jam Update:</strong> {item.timeFetched || "-"}<br/>
                    - <strong>Sumber Asli:</strong> {item.source || "unknown"}<br/>
                  </div>
                </div>

                {/* RINGKASAN BERITA ASLI */}
                <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                  <strong style={{ color: '#111', fontSize: '14px', marginBottom: '8px', display: 'block' }}>📝 Ringkasan Kejadian:</strong>
                  <p style={{ margin: 0, fontSize: '14px', color: '#444', lineHeight: '1.6' }}>
                    {item.summary || item.content || "Ringkasan berita tidak tersedia."}
                  </p>
                </div>

                {/* Tombol Pemanggil AI */}
                {!aiScript && (
                  <button 
                    onClick={() => handleGenerateAIScript(item, index)}
                    disabled={isGenerating}
                    style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: isGenerating ? '#e5e7eb' : '#dc2626', color: isGenerating ? '#6b7280' : '#fff', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: isGenerating ? 'wait' : 'pointer', transition: 'all 0.2s' }}
                  >
                    {isGenerating ? "⏳ AI sedang meracik Script & SEO..." : "✨ Generate Script + SEO via AI"}
                  </button>
                )}

                {/* HASIL DARI AI MURNI */}
                {aiScript && (
                  <div style={{ marginTop: '24px' }}>
                    
                    {/* --- YOUTUBE SEO METADATA --- */}
                    <div style={{ backgroundColor: '#fff', border: '2px solid #f59e0b', padding: '20px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                      <strong style={{ fontSize: '16px', color: '#d97706', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🚀 YouTube Shorts SEO Metadata
                      </strong>
                      
                      {/* Title */}
                      <div style={{ marginBottom: '16px', position: 'relative', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                        <strong style={{ color: '#92400e', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Judul Video (Clickbait & Algoritma):</strong>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#111' }}>
                          {aiScript.youtubeTitle || aiScript.title || aiScript.videoTitle || "Gagal membuat judul."}
                        </span>
                        <button 
                          onClick={() => handleCopy(aiScript.youtubeTitle || aiScript.title || aiScript.videoTitle || "", `yt-title-${index}`)}
                          style={{ position: 'absolute', top: '12px', right: '12px', background: copiedId === `yt-title-${index}` ? '#34d399' : '#fcd34d', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#000' }}>
                          {copiedId === `yt-title-${index}` ? "Copied!" : "Copy Judul"}
                        </button>
                      </div>

                      {/* Description */}
                      <div style={{ marginBottom: '16px', position: 'relative', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <strong style={{ color: '#4b5563', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Deskripsi Video:</strong>
                        <span style={{ fontSize: '14px', color: '#374151' }}>
                          {aiScript.youtubeDescription || aiScript.description || "Gagal membuat deskripsi."}
                        </span>
                        <button 
                          onClick={() => handleCopy(aiScript.youtubeDescription || aiScript.description || "", `yt-desc-${index}`)}
                          style={{ position: 'absolute', top: '12px', right: '12px', background: copiedId === `yt-desc-${index}` ? '#d1fae5' : '#e5e7eb', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                          {copiedId === `yt-desc-${index}` ? "Copied!" : "Copy Desc"}
                        </button>
                      </div>

                      {/* Hashtags */}
                      <div style={{ position: 'relative', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <strong style={{ color: '#166534', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Hashtags (FYP Target):</strong>
                        <span style={{ fontSize: '15px', color: '#1d4ed8', fontWeight: '500' }}>
                          {Array.isArray(aiScript.youtubeHashtags) ? aiScript.youtubeHashtags.join(" ") : (aiScript.youtubeHashtags || aiScript.hashtags?.join(" ") || "#roblox #robloxshorts")}
                        </span>
                        <button 
                          onClick={() => handleCopy(Array.isArray(aiScript.youtubeHashtags) ? aiScript.youtubeHashtags.join(" ") : (aiScript.youtubeHashtags || aiScript.hashtags?.join(" ") || ""), `yt-hash-${index}`)}
                          style={{ position: 'absolute', top: '12px', right: '12px', background: copiedId === `yt-hash-${index}` ? '#34d399' : '#bbf7d0', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#064e3b' }}>
                          {copiedId === `yt-hash-${index}` ? "Copied!" : "Copy Hashtags"}
                        </button>
                      </div>
                    </div>

                    {/* Rekomendasi Gameplay dari AI */}
                    {aiScript.gameplayPlan && (
                      <div style={{ backgroundColor: '#e0e7ff', borderLeft: '4px solid #4f46e5', padding: '16px', borderRadius: '0 12px 12px 0', marginBottom: '24px' }}>
                        <strong style={{ color: '#3730a3', fontSize: '14px', display: 'block', marginBottom: '4px' }}>🎮 Saran Gameplay dari AI ({aiScript.gameplayPlan.mainGameplayType}):</strong>
                        <p style={{ margin: 0, fontSize: '14px', color: '#312e81', lineHeight: '1.5' }}>
                          {(aiScript.gameplayPlan.recordingTips || []).join(" ")}
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      <button onClick={() => setExpandedIndex(expandedIndex === index ? null : index)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#111', color: '#fff', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                        {expandedIndex === index ? "Sembunyikan Script" : "Lihat Hasil AI"}
                      </button>
                      <button onClick={() => handleCopyFullVO(aiScript.scenes || [], index)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: copiedId === `full-vo-${index}` ? '#d1fae5' : '#10b981', color: copiedId === `full-vo-${index}` ? '#065f46' : '#fff', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                        {copiedId === `full-vo-${index}` ? "✓ Full VO Copied" : "📋 Copy Full VO"}
                      </button>
                    </div>

                    {/* Area Tampilan Scene AI */}
                    {expandedIndex === index && aiScript.scenes && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {aiScript.scenes.map((scene: any, sIdx: number) => (
                          <div key={sIdx} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb' }}>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px', marginBottom: '12px' }}>
                              <strong style={{ color: '#111' }}>Scene {scene.scene || sIdx + 1} - {scene.name || 'Hook'}</strong>
                              <span style={{ backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>⌚ {scene.duration || scene.timestamp || "0:00"}</span>
                            </div>
                            
                            {/* Visual Direction */}
                            <div style={{ marginBottom: '16px', fontSize: '14px' }}>
                              <strong style={{ color: '#6b7280' }}>🎬 Visual / Video Direction:</strong>
                              <p style={{ margin: '4px 0 0 0', lineHeight: '1.5' }}>{scene.gameplayDirection || scene.visual || scene.overlayText}</p>
                            </div>

                            {/* Voice Over Text */}
                            <div style={{ marginBottom: '16px', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', position: 'relative' }}>
                              <strong style={{ color: '#6b7280', fontSize: '14px' }}>🎙️ Voice Over:</strong>
                              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '500', lineHeight: '1.5' }}>"{scene.vo || scene.voiceOver}"</p>
                              <button 
                                onClick={() => handleCopy(scene.vo || scene.voiceOver, `vo-${index}-${sIdx}`)}
                                style={{ position: 'absolute', top: '12px', right: '12px', background: copiedId === `vo-${index}-${sIdx}` ? '#d1fae5' : '#e5e7eb', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {copiedId === `vo-${index}-${sIdx}` ? "Copied!" : "Copy VO"}
                              </button>
                            </div>

                            {/* Gemini Prompts dari AI */}
                            {scene.imagePrompts && scene.imagePrompts.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {scene.imagePrompts.map((prompt: string, pIdx: number) => (
                                  <div key={pIdx} style={{ border: '1px solid #e5e7eb', padding: '10px', borderRadius: '8px', position: 'relative' }}>
                                    <strong style={{ color: pIdx === 0 ? '#10b981' : '#8b5cf6', fontSize: '12px' }}>✨ Image Prompt {pIdx + 1}:</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontFamily: 'monospace' }}>{prompt}</p>
                                    <button 
                                      onClick={() => handleCopy(prompt, `p${pIdx}-${index}-${sIdx}`)}
                                      style={{ position: 'absolute', top: '10px', right: '10px', background: copiedId === `p${pIdx}-${index}-${sIdx}` ? '#d1fae5' : '#f3f4f6', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                                      {copiedId === `p${pIdx}-${index}-${sIdx}` ? "Copied!" : "Copy"}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RobloxCreatorFinalUI;