'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminCreator() {
    const [email, setEmail] = useState('');
    const [days, setDays] = useState(7);
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleBeriAkses = async () => {
        if (!email) {
            setStatus('⚠️ Tahan Jenderal! Email tidak boleh kosong.');
            return;
        }

        setIsLoading(true);
        setStatus('⏳ Mengamankan jalur ke Supabase...');
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(days));

        const { data, error } = await supabase
            .from('user_access')
            .upsert([
                { 
                    email: email, 
                    access_status: 'TRIAL', 
                    trial_expires_at: expiresAt.toISOString() 
                }
            ], { onConflict: 'email' });

        setIsLoading(false);

        if (error) {
            console.error(error);
            setStatus('❌ GAGAL: ' + error.message);
        } else {
            setStatus(`✅ BERHASIL! Lisensi ${days} hari untuk ${email} telah diaktifkan.`);
            setEmail(''); // Kosongkan form setelah sukses
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4 relative overflow-hidden font-sans">
            {/* Lampu Sorot Belakang (Glow Effects) */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-pulse"></div>

            {/* Kotak Utama (Glassmorphism) */}
            <div className="relative z-10 w-full max-w-lg bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-10">
                
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 mb-2">
                        Admin Creator
                    </h1>
                    <p className="text-gray-400 text-sm tracking-widest uppercase font-semibold">License Control Center</p>
                </div>
                
                <div className="space-y-6">
                    {/* Input Email */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email Klien Baru</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-500">📧</span>
                            </div>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-800/80 border border-gray-700 text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                                placeholder="nama@gmail.com"
                            />
                        </div>
                    </div>

                    {/* Pilihan Waktu */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Durasi Uji Coba (Trial)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-500">⏱️</span>
                            </div>
                            <select 
                                value={days} 
                                onChange={(e) => setDays(e.target.value)}
                                className="w-full bg-gray-800/80 border border-gray-700 text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner appearance-none"
                            >
                                <option value={7}>1 Minggu (7 Hari)</option>
                                <option value={14}>2 Minggu (14 Hari)</option>
                                <option value={30}>1 Bulan (VIP)</option>
                            </select>
                        </div>
                    </div>

                    {/* Tombol Eksekusi */}
                    <button 
                        onClick={handleBeriAkses}
                        disabled={isLoading}
                        className={`w-full font-bold text-lg py-4 rounded-xl shadow-lg transform transition-all active:scale-95 flex justify-center items-center gap-2 mt-4 
                            ${isLoading 
                                ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:shadow-blue-500/25'}`}
                    >
                        {isLoading ? 'Memproses Data...' : '🚀 Aktifkan Lisensi Sekarang'}
                    </button>

                    {/* Panel Status Notifikasi */}
                    {status && (
                        <div className={`mt-6 p-4 rounded-xl text-sm text-center font-medium border ${
                            status.includes('BERHASIL') 
                                ? 'bg-green-900/30 border-green-500/50 text-green-400' 
                                : status.includes('⏳') 
                                    ? 'bg-blue-900/30 border-blue-500/50 text-blue-400'
                                    : 'bg-red-900/30 border-red-500/50 text-red-400'
                        }`}>
                            {status}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}