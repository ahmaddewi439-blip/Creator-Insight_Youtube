import React, { useState } from "react";

const RobloxCreatorFinalUI = () => {
  const [updateData, setUpdateData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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

      const isEn = language === "en";
      const dataWithScenes = data.sources.map((item: any) => ({
        ...item,
        gameplayRecommendation: isEn 
          ? "Record yourself playing highly visual games like 'Brookhaven' (driving fast cars) or 'Tower of Hell' (doing parkour jumps). Fast on-screen movement retains viewer attention while they listen to the VO. Avoid static screens!"
          : "Screen-record gameplay yang visualnya bergerak cepat seperti parkour di 'Tower of Hell' atau nyetir mobil di 'Brookhaven'. Gerakan cepat di layar menahan retensi penonton saat mereka mendengar VO. Hindari layar statis/diam!",
        scenes: [
          {
            sceneNumber: "Scene 1 – The Hook",
            timestamp: "0:00 – 0:03",
            voiceOver: isEn 
              ? `Stop scrolling! Roblox just secretly dropped an update that changes EVERYTHING...` 
              : `Berhenti scroll! Roblox baru aja diam-diam rilis update yang bakal ngerubah SEGALANYA...`,
            visual: "Zoom in quickly on a shocked Roblox avatar face. Flash a red '?' or 'WARNING' sign on the screen.",
            prompt1: "A cinematic 3D render of a Roblox avatar looking incredibly shocked, eyes wide open, glowing red warning sign floating in the background, dramatic lighting, vertical 9:16 aspect ratio, high definition.",
            prompt2: "Close up shot of a Roblox character's face gasping, neon cyberpunk city background, high contrast, vibrant colors, YouTube shorts style thumbnail, vertical 9:16.",
          },
          {
            sceneNumber: "Scene 2 – The Core Issue",
            timestamp: "0:03 – 0:15",
            voiceOver: isEn 
              ? `Players are going crazy because ${item.title} is completely breaking the game mechanics.` 
              : `Banyak player yang panik gara-gara ${item.title} ngerusak sistem gamenya total.`,
            visual: "Show fast-paced background gameplay (parkour). Overlay screenshots of the actual news or tweet regarding the update.",
            prompt1: "A 3D isometric view of a glitching Roblox game environment, digital matrix code raining down, panicked avatars running, cinematic lighting, 9:16 format.",
            prompt2: "A glowing futuristic news screen displaying a breaking news alert in a Roblox world, blurred avatars looking at it, vertical 9:16.",
          },
          {
            sceneNumber: "Scene 3 – Deep Dive",
            timestamp: "0:15 – 0:30",
            voiceOver: isEn 
              ? `Here is the crazy part: ${item.summary?.substring(0, 80) || "this new secret feature"}... This means you might lose your limited items if you're not careful!` 
              : `Yang lebih gilanya lagi: ${item.summary?.substring(0, 80) || "fitur rahasia ini"}... Artinya kalian bisa kehilangan item limited kalau nggak hati-hati!`,
            visual: "Gameplay continues. Add a pop-up animation of a rare Roblox item (Dominus/Valkyrie) shattering or getting locked.",
            prompt1: "A rare valuable Roblox Dominus hat trapped inside a glowing energy cage, dark dramatic background, 3D render, vertical 9:16.",
            prompt2: "A Roblox avatar desperately reaching out for a floating golden crown that is fading away into pixels, sad emotion, cinematic lighting, vertical 9:16.",
          },
          {
            sceneNumber: "Scene 4 – The Fix / Workaround",
            timestamp: "0:30 – 0:45",
            voiceOver: isEn 
              ? `But don't panic! Top developers are saying you just need to avoid the marketplace until the patch goes live tomorrow.` 
              : `Tapi jangan panik dulu! Developer top nyaranin kalian buat ngehindarin marketplace sampai patch-nya rilis besok.`,
            visual: "Show a big green 'SAFE' checkmark over the gameplay. Show the Roblox logo shining.",
            prompt1: "A heroic Roblox avatar holding a glowing green shield, defending against digital red glitches, epic superhero pose, 9:16 aspect ratio.",
            prompt2: "A bright, cheerful Roblox marketplace building with a giant glowing green checkmark floating above it, sunny day, vibrant 3D style, vertical 9:16.",
          },
          {
            sceneNumber: "Scene 5 – Strong CTA",
            timestamp: "0:45 – 0:60",
            voiceOver: isEn 
              ? `What do you think about this update? Drop a comment below, hit that like button, and subscribe so you never miss another Roblox secret!` 
              : `Menurut kalian update ini ngebantu atau malah makin ribet? Coba komen di bawah! Jangan lupa like dan subscribe biar nggak ketinggalan rahasia Roblox lainnya!`,
            visual: "Gameplay slows down. Big animated arrows pointing to the Like and Subscribe buttons. End screen pop-up.",
            prompt1: "A group of happy Roblox avatars pointing directly at the camera, neon 'SUBSCRIBE' text floating in the air, party confetti falling, vertical 9:16.",
            prompt2: "A cool Roblox character holding a glowing YouTube play button, thumbs up gesture, energetic background, 3D cinematic render, vertical 9:16.",
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

  const handleCopyFullVO = (scenes: any[], index: number) => {
    const fullVO = scenes.map(s => s.voiceOver).join(" ");
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
          disabled={loading}
          style={{ padding: '14px 24px', borderRadius: '12px', backgroundColor: loading ? '#ccc' : '#000', color: '#fff', border: 'none', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px' }}
        >
          {loading ? "Generating..." : "Search Update"}
        </button>
      </div>

      {/* --- HASIL KONTEN AI --- */}
      {updateData && updateData.sources && updateData.sources.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {updateData.sources.map((item: any, index: number) => (
            <div key={index} style={{ backgroundColor: '#f0f4f9', borderRadius: '24px', padding: '24px' }}>
              
              {/* JUDUL BERITA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: '800', fontSize: '20px', color: '#111', lineHeight: '1.4' }}>📰 {item.title}</span>
              </div>

              {/* DATA INFO LENGKAP (Tanggal, Jam, Bahasa, dll) */}
              <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                <strong style={{ fontSize: '14px', color: '#111', marginBottom: '8px', display: 'block' }}>ℹ️ Detail Informasi:</strong>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#555', lineHeight: '1.8' }}>
                  - <strong>Tanggal Update:</strong> {item.dateFetched || "-"}<br/>
                  - <strong>Jam Update:</strong> {item.timeFetched || "-"}<br/>
                  - <strong>Sumber Data:</strong> {item.source || "unknown"}<br/>
                  - <strong>Target Voice Over:</strong> {language === 'en' ? 'English' : 'Indonesian'}<br/>
                  - <strong>Query Dipakai:</strong> {item.queryUsed || searchKeyword}
                </div>
              </div>

              {/* RINGKASAN BERITA ASLI */}
              <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <strong style={{ color: '#111', fontSize: '14px', marginBottom: '8px', display: 'block' }}>📝 Ringkasan Berita Asli:</strong>
                <p style={{ margin: 0, fontSize: '14px', color: '#444', lineHeight: '1.6' }}>
                  {item.summary || "Ringkasan berita tidak tersedia dari sumber."}
                </p>
              </div>

              {/* Rekomendasi Gameplay */}
              <div style={{ backgroundColor: '#e0e7ff', borderLeft: '4px solid #4f46e5', padding: '16px', borderRadius: '0 12px 12px 0', marginBottom: '24px' }}>
                <strong style={{ color: '#3730a3', fontSize: '14px', display: 'block', marginBottom: '4px' }}>🎮 Gameplay Footage Recommendation:</strong>
                <p style={{ margin: 0, fontSize: '14px', color: '#312e81', lineHeight: '1.5' }}>{item.gameplayRecommendation}</p>
              </div>

              {/* Tombol Aksi Global Item */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <button onClick={() => setExpandedIndex(expandedIndex === index ? null : index)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  {expandedIndex === index ? "Hide Full Script" : "Show Full Script"}
                </button>
                <button onClick={() => handleCopyFullVO(item.scenes, index)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: copiedId === `full-vo-${index}` ? '#d1fae5' : '#10b981', color: copiedId === `full-vo-${index}` ? '#065f46' : '#fff', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  {copiedId === `full-vo-${index}` ? "✓ Full VO Copied" : "📋 Copy Full VO"}
                </button>
              </div>

              {/* Area Tampilan Scene Detail */}
              {(expandedIndex === index || index === 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {item.scenes.map((scene: any, sIdx: number) => (
                    <div key={sIdx} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px', marginBottom: '12px' }}>
                        <strong style={{ color: '#111' }}>{scene.sceneNumber}</strong>
                        <span style={{ backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>⌚ {scene.timestamp}</span>
                      </div>
                      
                      {/* Visual Direction */}
                      <div style={{ marginBottom: '16px', fontSize: '14px' }}>
                        <strong style={{ color: '#6b7280' }}>🎬 Visual / Video Direction:</strong>
                        <p style={{ margin: '4px 0 0 0', lineHeight: '1.5' }}>{scene.visual}</p>
                      </div>

                      {/* Voice Over Text */}
                      <div style={{ marginBottom: '16px', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', position: 'relative' }}>
                        <strong style={{ color: '#6b7280', fontSize: '14px' }}>🎙️ Voice Over:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '500', lineHeight: '1.5' }}>"{scene.voiceOver}"</p>
                        <button 
                          onClick={() => handleCopy(scene.voiceOver, `vo-${index}-${sIdx}`)}
                          style={{ position: 'absolute', top: '12px', right: '12px', background: copiedId === `vo-${index}-${sIdx}` ? '#d1fae5' : '#e5e7eb', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                          {copiedId === `vo-${index}-${sIdx}` ? "Copied!" : "Copy VO"}
                        </button>
                      </div>

                      {/* Gemini Prompts */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        
                        <div style={{ border: '1px solid #e5e7eb', padding: '10px', borderRadius: '8px', position: 'relative' }}>
                          <strong style={{ color: '#10b981', fontSize: '12px' }}>✨ Image Prompt 1:</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontFamily: 'monospace' }}>{scene.prompt1}</p>
                          <button 
                            onClick={() => handleCopy(scene.prompt1, `p1-${index}-${sIdx}`)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: copiedId === `p1-${index}-${sIdx}` ? '#d1fae5' : '#f3f4f6', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                            {copiedId === `p1-${index}-${sIdx}` ? "Copied!" : "Copy"}
                          </button>
                        </div>

                        <div style={{ border: '1px solid #e5e7eb', padding: '10px', borderRadius: '8px', position: 'relative' }}>
                          <strong style={{ color: '#8b5cf6', fontSize: '12px' }}>✨ Image Prompt 2:</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontFamily: 'monospace' }}>{scene.prompt2}</p>
                          <button 
                            onClick={() => handleCopy(scene.prompt2, `p2-${index}-${sIdx}`)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: copiedId === `p2-${index}-${sIdx}` ? '#d1fae5' : '#f3f4f6', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                            {copiedId === `p2-${index}-${sIdx}` ? "Copied!" : "Copy"}
                          </button>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RobloxCreatorFinalUI;