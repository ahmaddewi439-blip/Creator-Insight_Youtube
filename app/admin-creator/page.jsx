'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// --- KOMPONEN DAFTAR USER (TETAP SAMA, SUDAH SEMPURNA) ---
function UserCard({ user, onUpdate, onDelete }) {
    const [days, setDays] = useState(7);
    const expiryDate = user.trial_expires_at ? new Date(user.trial_expires_at) : null;

    return (
        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
            <h3 style={{ margin: '5px 0', fontSize: '18px', color: '#fff' }}>📧 {user.email}</h3>
            
            <div style={{ fontSize: '13px', color: '#bbb', marginBottom: '10px' }}>
                Status: <strong style={{ color: user.access_status === 'TRIAL' ? '#2ecc71' : '#f1c40f' }}>{user.access_status}</strong>
                {expiryDate && (
                     <span> | Exp: {expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                    value={days} 
                    onChange={(e) => setDays(e.target.value)} 
                    style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#fff', color: '#000' }}
                >
                    <option value={7}>7 Hari (1 Minggu)</option>
                    <option value={14}>14 Hari (2 Minggu)</option>
                    <option value={30}>30 Hari (1 Bulan)</option>
                </select>
                
                <button onClick={() => onUpdate(user.email, days)} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Aktifkan 🚀</button>
                <button onClick={() => onDelete(user.email)} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Hapus 🗑️</button>
            </div>
        </div>
    );
}

// --- HALAMAN UTAMA ADMIN (DENGAN GEMBOK PASSWORD) ---
export default function AdminCreator() {
    
    // 🔐 GANTI PASSWORD RAHASIA ANDA DI SINI 🔐
    const PASSWORD_ADMIN = "komandan123"; 

    // State untuk Login
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [inputPass, setInputPass] = useState('');
    const [loginError, setLoginError] = useState('');

    // State untuk Dashboard
    const [newEmail, setNewEmail] = useState('');
    const [users, setUsers] = useState([]);
    const [statusMsg, setStatusMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Ambil data hanya jika sudah berhasil login
    useEffect(() => {
        if (isLoggedIn) {
            fetchUsers();
        }
    }, [isLoggedIn]);

    const fetchUsers = async () => {
        setIsLoading(true);
        const { data } = await supabase.from('user_access').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
        setIsLoading(false);
    };

    const handleAddEmail = async () => {
        if (!newEmail) return;
        setStatusMsg('⏳ Memasukkan email...');
        const { error } = await supabase.from('user_access').upsert([{ email: newEmail, access_status: 'PENDING' }], { onConflict: 'email' });
        if (!error) {
            setNewEmail('');
            setStatusMsg('✅ Berhasil ditambah!');
            fetchUsers(); 
        } else setStatusMsg('❌ Gagal: ' + error.message);
        setTimeout(() => setStatusMsg(''), 4000);
    };

    const handleUpdateTrial = async (email, days) => {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(days));
        const { error } = await supabase.from('user_access').update({ access_status: 'TRIAL', trial_expires_at: expiresAt.toISOString() }).eq('email', email);
        if (!error) { alert(`✅ Lisensi ${days} hari untuk ${email} diaktifkan.`); fetchUsers(); }
    };

    const handleDeleteEmail = async (email) => {
        const konfirmasi = window.confirm(`Peringatan ⚠️\n\nYakin hapus ${email}?`);
        if (!konfirmasi) return; 
        const { error } = await supabase.from('user_access').delete().eq('email', email);
        if (!error) { alert(`✅ ${email} dihapus.`); fetchUsers(); }
    };

    // Fungsi Eksekusi Pengecekan Password
    const handleLoginSubmit = (e) => {
        e.preventDefault();
        if (inputPass === PASSWORD_ADMIN) {
            setIsLoggedIn(true);
            setLoginError('');
        } else {
            setLoginError('❌ Akses Ditolak! Password Salah.');
        }
    };

    // ⛔ TAMPILAN 1: PINTU GERBANG LOGIN (Jika belum login) ⛔
    if (!isLoggedIn) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
                <div style={{ backgroundColor: '#1a1a2e', padding: '40px', borderRadius: '12px', border: '1px solid #333', textAlign: 'center', width: '90%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <h2 style={{ margin: '0 0 25px 0', color: '#fff' }}>🔐 Markas Komando</h2>
                    <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input 
                            type="password" 
                            value={inputPass}
                            onChange={(e) => setInputPass(e.target.value)}
                            placeholder="Masukkan Password Rahasia..."
                            style={{ padding: '14px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#0f0f1a', color: 'white', fontSize: '16px', outline: 'none' }}
                        />
                        <button 
                            type="submit"
                            style={{ padding: '14px', borderRadius: '6px', backgroundColor: '#e74c3c', color: 'white', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '16px', transition: '0.3s' }}
                        >
                            Buka Brankas Akses
                        </button>
                    </form>
                    {loginError && <p style={{ color: '#ff6b6b', marginTop: '20px', fontWeight: 'bold' }}>{loginError}</p>}
                </div>
            </div>
        );
    }

    // ✅ TAMPILAN 2: DASHBOARD ADMIN (Jika password benar) ✅
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', padding: '30px', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '25px' }}>
                    <div>
                        <h1 style={{ color: '#fff', margin: '0 0 5px 0' }}>Pusat Kontrol Lisensi</h1>
                        <p style={{ color: '#aaa', margin: '0' }}>Creator Insight - Admin Dashboard</p>
                    </div>
                    {/* Tombol Logout */}
                    <button onClick={() => { setIsLoggedIn(false); setInputPass(''); }} style={{ padding: '8px 15px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Keluar 🔒</button>
                </div>

                <div style={{ backgroundColor: '#1a1a2e', padding: '25px', borderRadius: '10px', marginBottom: '40px', border: '1px solid #333' }}>
                    <h2 style={{ color: '#fff', marginTop: '0', fontSize: '18px' }}>➕ Tambah Klien Baru</h2>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Ketik email klien..." style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#0f0f1a', color: 'white' }} />
                        <button onClick={handleAddEmail} style={{ padding: '12px 20px', borderRadius: '6px', backgroundColor: '#ecf0f1', color: '#111', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>Masukkan ke Daftar</button>
                    </div>
                    {statusMsg && <p style={{ color: '#5dade2', marginTop: '15px', fontSize: '14px' }}>{statusMsg}</p>}
                </div>

                <div>
                    <h2 style={{ color: '#fff', borderBottom: '2px solid #333', paddingBottom: '10px' }}>📋 Daftar Manajemen Akses</h2>
                    {isLoading ? ( <div style={{ color: '#aaa', padding: '20px 0' }}>Memuat data...</div> ) : users.length === 0 ? ( <div style={{ color: '#aaa', padding: '20px 0' }}>Belum ada email yang terdaftar.</div> ) : (
                        <div style={{ marginTop: '20px' }}>
                            {users.map((user) => ( <UserCard key={user.id} user={user} onUpdate={handleUpdateTrial} onDelete={handleDeleteEmail} /> ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}