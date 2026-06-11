import React, { useState } from "react";

const RobloxCreatorFinalUI = () => {
  const [updateData, setUpdateData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("natural-news");
  const [searchKeyword, setSearchKeyword] = useState("Roblox");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleSearchUpdate = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/search-roblox-update?keyword=${encodeURIComponent(
          searchKeyword
        )}&category=${encodeURIComponent(selectedCategory)}`
      );
      const data = await response.json();
      
      if (!data.success) {
        alert(data.error || "Gagal mengambil data Roblox.");
        return;
      }

      // Memetakan data dengan struktur scene yang detail sesuai draf ideal Anda
      const dataWithScenes = data.sources.map((item: any) => ({
        ...item,
        scenes: [
          {
            sceneNumber: "Scene 1 – Hook",
            duration: "0–3 seconds",
            voiceOver: `"Roblox just dropped something players didn't expect..."`,
            visual: `A shocked Roblox avatar looking at a glowing announcement screen.`,
            prompt: `Create a cinematic Roblox-style 3D image of a surprised Roblox avatar standing in a futuristic game lobby, glowing announcement screen in the background, dramatic blue and purple lighting, strong facial expression, dynamic camera angle, vertical 9:16 format, high detail, clean composition, YouTube Shorts style.`
          }
        ],
      }));

      setUpdateData({ ...data, sources: dataWithScenes });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCaption = (item: any, index: number) => {
    const textToCopy = `${item.title}\n${item.summary}\nSource: ${item.source}\nCategory: ${item.category}\nQuery: ${item.queryUsed}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    });
  };

  const handleGeneratePromptShort = (item: any) => {
    const prompt = `Create a Roblox Short:\nTitle: ${item.title}\nSummary: ${item.summary}\nKeyword: ${searchKeyword}\nCategory: ${selectedCategory}\n\nScenes:\n${item.scenes.map((s:any) => `${s.sceneNumber}\nDuration: ${s.duration}\nVO: ${s.voiceOver}\nVisual: ${s.visual}\nPrompt: ${s.prompt}`).join('\n\n')}`;
    navigator.clipboard.writeText(prompt);
    alert("Prompt Short berhasil disalin!");
  };

  const handleCopyAllScenes = (item: any) => {
    const allScenes = `${item.title}\nScenes:\n${item.scenes.map((s:any) => `${s.sceneNumber}\nDuration: ${s.duration}\nVO: ${s.voiceOver}\nVisual: ${s.visual}\nPrompt: ${s.prompt}`).join('\n\n')}`;
    navigator.clipboard.writeText(allScenes);
    alert("Semua Scenes berhasil disalin!");
  };

  return (
    <div style={{ padding: '20px 0', maxWidth: '850px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#1f2937' }}>
      
      {/* --- BAGIAN INPUT KEYWORD & KATEGORI --- */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Input keyword..." 
          style={{ flex: 1, minWidth: '200px', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '15px' }}
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
        <button 
          onClick={handleSearchUpdate}
          disabled={loading}
          style={{ padding: '14px 24px', borderRadius: '12px', backgroundColor: loading ? '#ccc' : '#000', color: '#fff', border: 'none', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px' }}
        >
          {loading ? "Mencari..." : "Search Update"}
        </button>
      </div>

      {/* --- BAGIAN CARD DATA HASIL AI (Desain Estetik Sesuai Gambar Referensi) --- */}
      {updateData && updateData.sources && updateData.sources.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {updateData.sources.map((item: any, index: number) => (
            <div key={index} style={{ backgroundColor: '#f0f4f9', borderRadius: '24px', padding: '24px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontWeight: '600', fontSize: '15px', color: '#444' }}>Plain text</span>
              </div>

              {/* Teks Metadata Monospace */}
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '14px', color: '#111', marginBottom: '24px', lineHeight: '1.8' }}>
                - Sumber data: {item.source}<br/>
                - Tanggal update: {item.dateFetched}<br/>
                - Jam update: {item.timeFetched}<br/>
                - Query yang dipakai: {item.queryUsed || searchKeyword}
              </div>

              {/* Tombol-Tombol Aksi Kelola Konten */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <button onClick={() => handleCopyCaption(item, index)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: copiedIndex === index ? '#d1fae5' : '#fff', border: '1px solid #ddd', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                  {copiedIndex === index ? "Copied!" : "Copy Caption"}
                </button>
                <button onClick={() => handleGeneratePromptShort(item)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#fff', border: '1px solid #ddd', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                  Generate Prompt Short
                </button>
                <button onClick={() => setExpandedIndex(expandedIndex === index ? null : index)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#fff', border: '1px solid #ddd', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                  {expandedIndex === index ? "Hide Scenes" : "Show Scenes"}
                </button>
                <button onClick={() => handleCopyAllScenes(item)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#fff', border: '1px solid #ddd', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                  Copy All Scenes
                </button>
              </div>

              {/* Area Tampilan Konten Per-Scene */}
              {(expandedIndex === index || index === 0) && item.scenes.map((scene: any, sIdx: number) => (
                <div key={sIdx} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb', marginTop: '16px' }}>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '14px', lineHeight: '1.8', color: '#111' }}>
                    <strong>{scene.sceneNumber}</strong><br/>
                    Duration: {scene.duration}<br/>
                    Voice Over: {scene.voiceOver}<br/><br/>
                    Visual:<br/>{scene.visual}<br/><br/>
                    <strong>Gemini Image Prompt:</strong><br/>{scene.prompt}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RobloxCreatorFinalUI;