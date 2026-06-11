import React, { useState } from 'react';

export default function RobloxCreatorFinal() {
  const [keyword, setKeyword] = useState('');
  const [kategori, setKategori] = useState('');

  const handleSearchUpdate = () => {
    alert(`Mencari data untuk: ${keyword || 'Kosong'} di kategori: ${kategori || 'Kosong'}`);
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '850px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937' }}>
      
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
        Roblox Creator Final
      </h1>

      {/* --- BAGIAN INPUT --- */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Input keyword..." 
          style={{ flex: 1, minWidth: '200px', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '15px' }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select 
          style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '15px', backgroundColor: '#fff', cursor: 'pointer' }}
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
        >
          <option value="">Pilih Kategori</option>
          <option value="gaming">Gaming</option>
          <option value="tutorial">Tutorial</option>
          <option value="news">News</option>
        </select>
        <button 
          onClick={handleSearchUpdate}
          style={{ padding: '14px 24px', borderRadius: '12px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '15px', transition: '0.2s' }}
        >
          Search Update
        </button>
      </div>

      {/* --- BAGIAN CARD UTAMA (Desain ala gambar referensi) --- */}
      <div style={{ backgroundColor: '#f0f4f9', borderRadius: '24px', padding: '24px' }}>
        
        {/* Header "Plain text" dengan Ikon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontWeight: '600', fontSize: '15px', color: '#444' }}>Plain text</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Copy All">
            📋
          </button>
        </div>

        {/* Data Meta (Font Monospace) */}
        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '14px', color: '#111', marginBottom: '24px', lineHeight: '1.8' }}>
          - Sumber data: YouTube API<br/>
          - Tanggal update: 11 Juni 2026<br/>
          - Jam update: 21:00 WIB<br/>
          - Query yang dipakai: {keyword || '-'}
        </div>

        {/* Tombol Aksi */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {['Copy Caption', 'Generate Prompt Short', 'Show Scenes', 'Copy All Scenes'].map(btnName => (
            <button key={btnName} style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#fff', border: '1px solid #ddd', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#444' }}>
              {btnName}
            </button>
          ))}
        </div>

        {/* Area Tampilan Scene */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '14px', lineHeight: '1.8', color: '#111' }}>
            Scene 1 – Hook<br/>
            Duration: 0–3 seconds<br/>
            Voice Over: "Roblox just dropped something players didn't expect..."<br/>
            <br/>
            Visual:<br/>
            A shocked Roblox avatar looking at a glowing announcement screen.<br/>
            <br/>
            Gemini Image Prompt:<br/>
            Create a cinematic Roblox-style 3D image of a surprised Roblox avatar standing in a futuristic game lobby, glowing announcement screen in the background, dramatic blue and purple lighting, strong facial expression, dynamic camera angle, vertical 9:16 format, high detail, clean composition, YouTube Shorts style.
          </div>
        </div>

      </div>
    </div>
  );
}