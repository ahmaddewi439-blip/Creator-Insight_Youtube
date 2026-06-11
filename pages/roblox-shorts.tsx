import React, { useState } from 'react';

export default function RobloxCreatorFinal() {
  const [keyword, setKeyword] = useState('');
  const [kategori, setKategori] = useState('');

  // Fungsi sementara untuk tombol search
  const handleSearchUpdate = () => {
    alert(`Mencari data untuk: ${keyword || 'Kosong'} di kategori: ${kategori || 'Kosong'}`);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        Roblox Creator Final
      </h1>

      {/* --- BAGIAN INPUT --- */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Input keyword" 
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', flex: 1 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select 
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
        >
          <option value="">Kategori</option>
          <option value="gaming">Gaming</option>
          <option value="tutorial">Tutorial</option>
          <option value="news">News</option>
        </select>
        <button 
          onClick={handleSearchUpdate}
          style={{ padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Search Update
        </button>
      </div>

      {/* --- BAGIAN CARD HASIL DATA --- */}
      <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '14px', color: '#555', marginBottom: '20px', lineHeight: '1.6' }}>
          <p><strong>Sumber data:</strong> YouTube API</p>
          <p><strong>Tanggal update:</strong> 11 Juni 2026</p>
          <p><strong>Jam update:</strong> 21:00 WIB</p>
          <p><strong>Query yang dipakai:</strong> {keyword || "-"}</p>
        </div>

        {/* --- TOMBOL AKSI --- */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer' }}>Copy Caption</button>
          <button style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer' }}>Generate Prompt Short</button>
          <button style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer' }}>Show Scenes</button>
          <button style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer' }}>Copy All Scenes</button>
        </div>

        {/* AREA TAMPILAN SCENE */}
        <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Scene 1 – Hook</h3>
          <p style={{ margin: '5px 0' }}><strong>Duration:</strong> 0–3 seconds</p>
          <p style={{ margin: '5px 0' }}><strong>Voice Over:</strong> "Roblox just dropped something players didn't expect..."</p>
          <p style={{ margin: '5px 0' }}><strong>Visual:</strong> A shocked Roblox avatar looking at a glowing announcement screen.</p>
          
          <div style={{ marginTop: '15px', backgroundColor: '#fff', padding: '10px', borderRadius: '5px', border: '1px dashed #ccc' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Gemini Image Prompt:</strong></p>
            <p style={{ margin: 0, fontSize: '14px', color: '#444' }}>
              Create a cinematic Roblox-style 3D image of a surprised Roblox avatar standing in a futuristic game lobby, glowing announcement screen in the background, dramatic blue and purple lighting, strong facial expression, dynamic camera angle, vertical 9:16 format, high detail, clean composition, YouTube Shorts style.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}