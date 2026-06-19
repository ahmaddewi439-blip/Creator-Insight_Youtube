import React, { useState } from "react";

const RobloxCreatorFinalUI = ({ updateData, aiScript, index, handleCopy, copiedId, expandedIndex, setExpandedIndex, handleCopyFullVO }: any) => {
  return (
    <div style={{ padding: '20px', maxWidth: '850px', margin: '0 auto' }}>
      {/* Jika ada updateData, mapping di sini */}
      {updateData?.sources?.map((item: any, idx: number) => (
        <div key={idx} style={{ backgroundColor: '#f0f4f9', borderRadius: '24px', padding: '24px', marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontWeight: '800', fontSize: '20px', color: '#111' }}>📰 {item.title}</span>
          </div>
          
          {/* Metadata & Script Section */}
          {aiScript && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ backgroundColor: '#fff', border: '2px solid #f59e0b', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                <strong style={{ fontSize: '16px', color: '#d97706', marginBottom: '16px', display: 'flex', gap: '8px' }}>
                  🚀 YouTube Shorts SEO Metadata
                </strong>

                {/* Thumbnail Prompt */}
                <div style={{ marginBottom: '16px', position: 'relative', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <strong style={{ color: '#b45309', fontSize: '13px', display: 'block' }}>🖼️ Prompt Thumbnail (9:16):</strong>
                  <p style={{ fontSize: '13px', fontFamily: 'monospace', color: '#111' }}>{aiScript.thumbnailPrompt || aiScript.thumbnail_prompt || "Gagal."}</p>
                  <button onClick={() => handleCopy(aiScript.thumbnailPrompt || aiScript.thumbnail_prompt || "", `yt-thumb-${index}`)} style={{ position: 'absolute', top: '12px', right: '12px', background: copiedId === `yt-thumb-${index}` ? '#34d399' : '#f59e0b', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#fff' }}>
                    {copiedId === `yt-thumb-${index}` ? "Copied!" : "Copy Thumb"}
                  </button>
                </div>

                {/* Title */}
                <div style={{ marginBottom: '16px', position: 'relative', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                  <strong style={{ color: '#92400e', fontSize: '13px', display: 'block' }}>Judul Video:</strong>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{aiScript.youtubeTitle || aiScript.title || "Gagal judul."}</span>
                  <button onClick={() => handleCopy(aiScript.youtubeTitle || aiScript.title || "", `yt-title-${index}`)} style={{ position: 'absolute', top: '12px', right: '12px', background: '#fcd34d', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    {copiedId === `yt-title-${index}` ? "Copied!" : "Copy Judul"}
                  </button>
                </div>
                {/* Deskripsi */}
                <div style={{ marginBottom: '16px', position: 'relative', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <strong style={{ color: '#4b5563', fontSize: '13px', display: 'block' }}>Deskripsi:</strong>
                  <span>{aiScript.youtubeDescription || aiScript.description || "Gagal deskripsi."}</span>
                  <button onClick={() => handleCopy(aiScript.youtubeDescription || aiScript.description || "", `yt-desc-${index}`)} style={{ position: 'absolute', top: '12px', right: '12px', background: '#e5e7eb', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    {copiedId === `yt-desc-${index}` ? "Copied!" : "Copy Deskripsi"}
                  </button>
                </div>

                {/* Hashtags */}
                <div style={{ position: 'relative', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <strong style={{ color: '#166534', fontSize: '13px', display: 'block' }}>Hashtags:</strong>
                  <span>{Array.isArray(aiScript.youtubeHashtags) ? aiScript.youtubeHashtags.join(" ") : (aiScript.youtubeHashtags || "#roblox")}</span>
                  <button onClick={() => handleCopy(Array.isArray(aiScript.youtubeHashtags) ? aiScript.youtubeHashtags.join(" ") : (aiScript.youtubeHashtags || ""), `yt-hash-${index}`)} style={{ position: 'absolute', top: '12px', right: '12px', background: '#bbf7d0', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    {copiedId === `yt-hash-${index}` ? "Copied!" : "Copy Hashtag"}
                  </button>
                </div>
              </div>

              {/* Gameplay & Scenes */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <button onClick={() => setExpandedIndex(expandedIndex === index ? null : index)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#111', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  {expandedIndex === index ? "Sembunyikan Script" : "Lihat Hasil AI"}
                </button>
                <button onClick={() => handleCopyFullVO(aiScript.scenes || [], index)} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  📋 Copy Full VO
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RobloxCreatorFinalUI;