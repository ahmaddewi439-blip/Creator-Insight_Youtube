'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function LicenseBanner() {
    const { data: session, status } = useSession();
    const [daysLeft, setDaysLeft] = useState<number | null>(null);

    useEffect(() => {
        // Mengambil catatan tanggal dari Satpam NextAuth
        const expireDateStr = (session as any)?.trial_expires_at;
        
        if (expireDateStr) {
            const expiry = new Date(expireDateStr);
            const now = new Date();
            const diffTime = expiry.getTime() - now.getTime();
            const diff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysLeft(diff);
        }
    }, [session]);

    // Sembunyikan banner jika data belum siap atau belum login
    if (status === 'loading' || daysLeft === null) return null; 

    // Logika Peringatan H-1 (Bisa diatur angkanya di sini, saat ini <= 1 hari)
    const isWarning = daysLeft <= 1;
    
    return (
        <div style={{
            backgroundColor: isWarning ? '#e74c3c' : '#1e3a8a', // Merah jika krisis, Biru jika aman
            color: 'white',
            padding: '12px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            fontFamily: 'sans-serif',
            borderBottom: isWarning ? '3px solid #c0392b' : '3px solid #1e40af',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            position: 'relative',
            zIndex: 9999
        }}>
            {isWarning 
                ? `⚠️ PERINGATAN: Lisensi Akses Anda Tersisa ${daysLeft} Hari Lagi! Harap Hubungi Admin.`
                : `✅ Lisensi Premium Aktif | Sisa Waktu Anda: ${daysLeft} Hari`}
        </div>
    );
}