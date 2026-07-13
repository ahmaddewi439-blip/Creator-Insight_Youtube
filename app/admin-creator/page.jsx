'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// --- KOMPONEN DAFTAR USER ---
function UserCard({ user, onUpdate, onDelete }) {
    const [days, setDays] = useState(7);
    
    const expiryDate = user.trial_expires_at ? new Date(user.trial_expires_at) : null;

    return (
        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
            <h3 style={{ margin: '5px 0', fontSize: '18px' }}>📧 {user.email}</h3>
            
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
                    style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                >
                    <option value={7}>7 Hari (1 Minggu)</option>
                    <option value={14}>14 Hari (2 Minggu)</option>
                    <option value={30}>30 Hari (1 Bulan)</option>
                </select>
                
                <button 
                    onClick={() => onUpdate(user.email, days)} 
                    style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                >
                    Aktifkan 🚀
                </button>

                {/* INI TOMBOL HAPUSNYA KOMANDAN */}
                <button 
                    onClick={() => onDelete(user.email)} 
                    style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                >
                    Hapus 🗑️
                </button>
            </div>
        </div>
    );
}

// --- HALAMAN UTAMA DASHBOARD ---
export default function AdminCreator() {
    const [newEmail, setNewEmail] = useState('');
    const [users, setUsers] = useState([]);
    const [statusMsg, setStatusMsg] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('user_access')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (data) setUsers(data);
        setIsLoading(false);
    };

    const handleAddEmail = async () => {
        if (!newEmail) return;
        setStatusMsg('⏳ Memasukkan email ke database...');
        
        const { error } = await supabase
            .from('user_access')
            .upsert([{ email: newEmail, access_status: 'PENDING' }], { onConflict: 'email' });
        
        if (!error) {
            setNewEmail('');
            setStatusMsg('✅ Email berhasil ditambahkan ke antrean!');
            fetchUsers(); 
        } else {
            setStatusMsg('❌ Gagal: ' + error.message);
        }
        setTimeout(() => setStatusMsg(''), 4000);
    };

    const handleUpdateTrial = async (email, days) => {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(days));

        const { error } = await supabase
            .from('user_access')
            .update({ 
                access_status: 'TRIAL', 
                trial_expires_at: expiresAt.toISOString() 
            })
            .eq('email', email);

        if (!error) {
            alert(`✅ SUKSES! Lisensi ${days} hari untuk ${email} resmi diaktifkan.`);
            fetchUsers(); 
        } else {
            alert('❌ Gagal mengaktifkan: ' + error.message);
        }
    };

    // --- FUNGSI BARU: EKSEKUSI HAPUS EMAIL ---
    const handleDeleteEmail = async (email) => {
        // Munculkan peringatan sebelum menghapus
        const konfirmasi = window.confirm(`Peringatan ⚠️\n\nApakah Anda yakin ingin MENGHAPUS klien ${email} dari database secara permanen?`);
        
        if (!konfirmasi) return; // Jika klik batal, batalkan proses

        const { error } = await supabase
            .from('user_access')
            .delete()
            .eq('email', email);

        if (!error) {
            alert(`✅ BERHASIL! Email ${email} telah dihapus dari sistem.`);
            fetchUsers(); // Refresh daftar agar email tersebut langsung hilang dari layar
        } else {
            alert('❌ Gagal menghapus: ' + error.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: '30px', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ color: '#fff', marginBottom: '5px' }}>Pusat Kontrol Lisensi</h1>
                <p style={{ color: '#aaa', marginTop: '0', marginBottom: '30px' }}>Creator Insight - Admin Dashboard</p>

                <div style={{ backgroundColor: '#1a1a2e', padding: '25px', borderRadius: '10px', marginBottom: '40px', border: '1px solid #333' }}>
                    <h2 style={{ color: '#fff', marginTop: '0', fontSize: '18px' }}>➕ Tambah Klien Baru</h2>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <input 
                            type="email" 
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Ketik email klien... (contoh: budi@gmail.com)"
                            style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#0f0f1a', color: 'white' }}
                        />
                        <button 
                            onClick={handleAddEmail}
                            style={{ padding: '12px 20px', borderRadius: '6px', backgroundColor: '#ecf0f1', color: '#111', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}
                        >
                            Masukkan ke Daftar
                        </button>
                    </div>
                    {statusMsg && <p style={{ color: '#5dade2', marginTop: '15px', fontSize: '14px' }}>{statusMsg}</p>}
                </div>

                <div>
                    <h2 style={{ color: '#fff', borderBottom: '2px solid #333', paddingBottom: '10px' }}>📋 Daftar Manajemen Akses</h2>
                    
                    {isLoading ? (
                        <div style={{ color: '#aaa', padding: '20px 0' }}>Memuat data dari brankas Supabase...</div>
                    ) : users.length === 0 ? (
                        <div style={{ color: '#aaa', padding: '20px 0' }}>Belum ada email yang terdaftar.</div>
                    ) : (
                        <div style={{ marginTop: '20px' }}>
                            {users.map((user) => (
                                <UserCard 
                                    key={user.id} 
                                    user={user} 
                                    onUpdate={handleUpdateTrial} 
                                    onDelete={handleDeleteEmail}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}