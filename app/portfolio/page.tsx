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
              <li><strong>Live