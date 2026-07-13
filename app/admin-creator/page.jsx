'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// --- KOMPONEN KARTU DAFTAR USER ---
function UserCard({ user, onUpdate }) {
    const [days, setDays] = useState(7);
    
    // Mengecek sisa waktu (opsional untuk tampilan)
    const expiryDate = user.trial_expires_at ? new Date(user.trial_expires_at) : null;
    const isExpired = expiryDate && expiryDate < new Date();

    return (
        <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-5 border border-gray-700 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:border-blue-500/50">
            <div className="w-full md:w-auto text-left">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    📧 {user.email}
                </h3>
                <div className="mt-2 flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.access_status === 'TRIAL' && !isExpired ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : user.access_status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                        {user.access_status}
                    </span>
                    {expiryDate && (
                         <span className="text-xs text-gray-400">
                             Exp: {expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                         </span>
                    )}
                </div>
            </div>

            {/* Panel Eksekusi Durasi Waktu */}
            <div className="w-full md:w-auto flex items-center gap-2 bg-gray-900 p-2 rounded-xl border border-gray-700">
                <select 
                    value={days} 
                    onChange={(e) => setDays(e.target.value)} 
                    className="bg-transparent text-white p-2 rounded-lg text-sm font-semibold focus:outline-none cursor-pointer"
                >
                    <option value={7}>7 Hari (1 Minggu)</option>
                    <option value={14}>14 Hari (2 Minggu)</option>
                    <option value={30}>30 Hari (VIP)</option>
                </select>
                <button 
                    onClick={() => onUpdate(user.email, days)} 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg transition-transform active:scale-95"
                >
                    Aktifkan 🚀
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

    // Ambil data dari Supabase saat halaman dibuka
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

    // Fungsi 1: Masukkan email ke daftar antrean (PENDING)
    const handleAddEmail = async () => {
        if (!newEmail) return;
        setStatusMsg('⏳ Memasukkan email ke database...');
        
        const { error } = await supabase
            .from('user_access')
            .upsert([{ email: newEmail, access_status: 'PENDING' }], { onConflict: 'email' });
        
        if (!error) {
            setNewEmail('');
            setStatusMsg('✅ Email berhasil ditambahkan ke antrean!');
            fetchUsers(); // Refresh daftar otomatis
        } else {
            setStatusMsg('❌ Gagal: ' + error.message);
        }
        setTimeout(() => setStatusMsg(''), 4000);
    };

    // Fungsi 2: Eksekusi pemberian lisensi dari daftar Card di bawah
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
            fetchUsers(); // Refresh daftar otomatis agar tanggal berubah
        } else {
            alert('❌ Gagal mengaktifkan: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white p-6 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto space-y-10">
                
                {/* HEADER */}
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        Pusat Kontrol Lisensi
                    </h1>
                    <p className="text-gray-400 mt-2">Creator Insight - Admin Dashboard</p>
                </div>

                {/* BAGIAN 1: FORM INPUT EMAIL BARU */}
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span>➕</span> Tambah Klien Baru
                    </h2>
                    <div className="flex flex-col md:flex-row gap-4">
                        <input 
                            type="email" 
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Ketik alamat email klien... (contoh: budi@gmail.com)"
                            className="flex-1 bg-gray-900 border border-gray-700 text-white px-5 py-4 rounded-xl focus:outline-none focus:border-blue-500 shadow-inner"
                        />
                        <button 
                            onClick={handleAddEmail}
                            className="bg-gray-100 hover:bg-white text-gray-900 font-bold px-8 py-4 rounded-xl transition-transform active:scale-95 shadow-lg"
                        >
                            Masukkan ke Daftar
                        </button>
                    </div>
                    {statusMsg && <p className="mt-4 text-sm text-blue-400 font-semibold">{statusMsg}</p>}
                </div>

                {/* BAGIAN 2: DAFTAR CARD EMAIL BAWAH */}
                <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span>📋</span> Daftar Manajemen Akses
                    </h2>
                    
                    {isLoading ? (
                        <div className="text-center text-gray-500 py-10 animate-pulse">Memuat data dari brankas...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center bg-gray-800/30 border border-dashed border-gray-700 rounded-2xl py-12 text-gray-500">
                            Belum ada email yang terdaftar.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Memunculkan Card untuk setiap email yang ada di database */}
                            {users.map((user) => (
                                <UserCard 
                                    key={user.id} 
                                    user={user} 
                                    onUpdate={handleUpdateTrial} 
                                />
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}