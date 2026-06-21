import React from 'react';

export default function PortfolioPage() {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '1100px', margin: '0 auto', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* --- HERO SECTION --- */}
      <div style={{ textAlign: 'center', marginBottom: '60px', padding: '40px 20px', background: 'linear-gradient(180deg, #0f172a 0%, #0b0f19 100%)', borderRadius: '16px', border: '1px solid #1e293b' }}>
        <h1 style={{ fontSize: '38px', color: '#38bdf8', margin: '0 0 16px 0', fontWeight: 'bold' }}>
          🚀 Creator Insight
        </h1>
        <h2 style={{ fontSize: '22px', color: '#e2e8f0', margin: '0 0 20px 0', fontWeight: 'normal' }}>
          The Ultimate AI-Powered Creator Dashboard
        </h2>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#94a3b8', maxWidth: '700px', margin: '0 auto' }}>
          "Mengubah jam kerja menjadi menit."<br/>
          Solusi all-in-one untuk Manajemen, Optimasi SEO, dan Produksi Konten YouTube.
        </p>
      </div>

      {/* --- PROBLEM & SOLUTION SECTION --- */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '60px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', background: '#1e293b', borderTop: '4px solid #ef4444', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ color: '#ef4444', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><span>🎯</span> Latar Belakang (The Problem)</h3>
          <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '15px' }}>
            Kreator konten saat ini menghabiskan <strong>70% waktunya untuk urusan teknis</strong>: riset keyword, memikirkan judul, menyusun deskripsi SEO, hingga copy-paste ke YouTube Studio secara manual. Proses ini sangat melelahkan dan menguras energi kreatif.
          </p>
        </div>
        <div style={{ flex: 1, minWidth: '300px', background: '#1e293b', borderTop: '4px solid #10b981', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ color: '#10b981', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><span>💡</span> Solusi (The Solution)</h3>
          <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '15px' }}>
            Creator Insight hadir sebagai <strong>"Asisten Digital + Pakar SEO Pribadi"</strong>. Aplikasi ini mengotomatiskan alur kerja YouTube dari A sampai Z dengan bantuan AI mutakhir dan integrasi langsung ke API YouTube yang aman dan real-time.
          </p>
        </div>
      </div>

      {/* --- CORE FEATURES SECTION --- */}
      <div style={{ marginBottom: '60px' }}>
        <h3 style={{ fontSize: '26px', color: '#f8fafc', marginBottom: '30px', borderBottom: '2px solid #334155', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🌟</span> Bedah Fitur Utama
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Feature 1 */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', padding: '24px', borderRadius: '12px', transition: 'transform 0.2s', cursor: 'default' }}>
            <h4 style={{ color: '#38bdf8', fontSize: '18px', marginTop: 0 }}>🏠 1. Dasbor (Pusat Kendali)</h4>
            <ul style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px', paddingLeft: '20px' }}>
              <li><strong>Live Tracking:</strong> Pantau views, likes, dan status video secara real-time.</li>
              <li><strong>Clean UI:</strong> Antarmuka modern yang membuat data analitik mudah dibaca dalam 3 detik pertama.</li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div style={{ background: '#0f172a', border: '1px solid #3b82f6', padding: '24px', borderRadius: '12px', boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)' }}>
            <h4 style={{ color: '#60a5fa', fontSize: '18px', marginTop: 0 }}>🔥 2. Optimasi (Mesin SEO AI)</h4>
            <ul style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px', paddingLeft: '20px' }}>
              <li><strong>AI Title Generator:</strong> 5 rekomendasi judul viral dengan Skor SEO realistis.</li>
              <li><strong>Smart Description:</strong> Draf deskripsi otomatis yang natural dan kaya keyword (tanpa hashtag spam).</li>
              <li><strong>Interactive Tags:</strong> Sistem hashtag interaktif ala vidIQ dengan lencana skor.</li>
              <li><strong>Magic '1-Click Sync':</strong> Terapkan perubahan langsung ke YouTube Studio tanpa buka tab baru.</li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', padding: '24px', borderRadius: '12px' }}>
            <h4 style={{ color: '#a78bfa', fontSize: '18px', marginTop: 0 }}>📈 3. Riset (Radar Kompetitor)</h4>
            <ul style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px', paddingLeft: '20px' }}>
              <li>Temukan celah konten yang sedang naik daun sebelum kompetitor menyadarinya.</li>
              <li>Analisa tren pencarian sehingga konten yang diproduksi pasti ada pasarnya.</li>
            </ul>
          </div>

          {/* Feature 4 */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', padding: '24px', borderRadius: '12px' }}>
            <h4 style={{ color: '#f472b6', fontSize: '18px', marginTop: 0 }}>🎬 4. Sutradara (Pabrik Konten)</h4>
            <ul style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px', paddingLeft: '20px' }}>
              <li>Penyusunan kerangka storyboard dan panduan B-roll otomatis.</li>
              <li>Pembuatan skrip dinamis yang menyesuaikan dengan gaya audiens masa kini (Gaming, Review, dll).</li>
            </ul>
          </div>

          {/* Feature 5 */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', padding: '24px', borderRadius: '12px' }}>
            <h4 style={{ color: '#34d399', fontSize: '18px', marginTop: 0 }}>🧠 5. Lab (Ruang Inovasi)</h4>
            <ul style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px', paddingLeft: '20px' }}>
              <li>Dapur uji coba untuk integrasi API E-Commerce masa depan (Shopee/TikTok).</li>
              <li>Riset produk potensial untuk konten UGC dan Affiliate Marketing.</li>
            </ul>
          </div>

        </div>
      </div>

      {/* --- TECH STACK SECTION --- */}
      <div style={{ background: '#020617', border: '1px solid #1e293b', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
        <h3 style={{ color: '#f8fafc', margin: '0 0 16px 0', fontSize: '20px' }}>⚙️ Teknologi di Balik Layar</h3>
        <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: 0 }}>
          Dibangun menggunakan arsitektur modern: <strong>Next.js & React</strong> untuk frontend super responsif, terintegrasi dengan <strong>Google Gemini AI</strong> untuk pemrosesan teks tingkat pakar, serta sinkronisasi aman via <strong>YouTube Data API v3</strong>.
        </p>
      </div>

    </div>
  );
}