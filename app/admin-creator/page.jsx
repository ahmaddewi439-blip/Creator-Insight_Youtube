'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminCreator() {
    const [email, setEmail] = useState('');
    const [days, setDays] = useState(7);
    const [status, setStatus] = useState('');

    const handleBeriAkses = async () => {
        setStatus('⏳ Memproses ke markas Supabase...');
        
        // Hitung tanggal kedaluwarsa (Hari ini + jumlah hari trial)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(days));

        // Tembakkan data email dan waktu ke tabel Supabase
        const { data, error } = await supabase
            .from('user_access')
            .upsert([
                { 
                    email: email, 
                    access_status: 'TRIAL', 
                    trial_expires_at: expiresAt.toISOString() 
                }
            ], { onConflict: 'email' }); // Jika email sudah ada, cukup perbarui waktunya

        if (error) {
            console.error(error);
            setStatus('❌ Gagal: ' + error.message);
        } else {
            setStatus(`✅ SUKSES! Email ${email} resmi diberi akses ${days} hari.`);
            setEmail(''); // Kosongkan kolom input setelah berhasil
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-8 text-white">
                <h1 className="text-2xl font-bold mb-1 text-blue-400">Panel Admin Rahasia</h1>
                <p className="text-gray-400 text-sm mb-6">Pusat kontrol lisensi Creator Insight</p>
                
                <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Email Pengguna Baru</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-600 bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="contoh: budi@gmail.com"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Berikan Waktu Trial</label>
                    <select 
                        value={days} 
                        onChange={(e) => setDays(e.target.value)}
                        className="w-full border border-gray-600 bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                        <option value={7}>1 Minggu (7 Hari)</option>
                        <option value={14}>2 Minggu (14 Hari)</option>
                    </select>
                </div>

                <button 
                    onClick={handleBeriAkses}
                    className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3 rounded-lg"
                >
                    🚀 Berikan Akses Sekarang
                </button>

                {status && (
                    <div className="mt-6 p-4 bg-gray-700 rounded-lg text-sm text-center border border-gray-600">
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}