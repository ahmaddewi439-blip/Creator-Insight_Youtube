'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // Menyambungkan Banner langsung ke Brankas

export default function LicenseBanner() {
    const { data: session, status } = useSession();
    
    // State untuk mesin hitung mundur
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isWarning, setIsWarning] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);

    // 1. AMBIL DATA REAL-TIME DARI SUPABASE (Bukan dari Cache Google)
    useEffect(() => {
        const fetchLiveDate = async () => {
            if (session?.user?.email) {
                const { data } = await supabase
                    .from('user_access')
                    .select('trial_expires_at')
                    .eq('email', session.user.email)
                    .single();

                if (data?.trial_expires_at) {
                    setExpiryDate(new Date(data.trial_expires_at));
                }
            }
        };
        fetchLiveDate();
    }, [session]);

    // 2. MESIN HITUNG MUNDUR (COUNTDOWN) SETIAP 1 DETIK
    useEffect(() => {
        if (!expiryDate) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diffTime = expiryDate.getTime() - now.getTime();

            // Jika waktu sudah habis
            if (diffTime <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                setIsWarning(true);
                setIsLoaded(true);
                clearInterval(interval);
                return;
            }

            // Rumus Matematika Waktu
            const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);

            setTimeLeft({ days, hours, minutes, seconds });
            setIsWarning(days <= 1); // Akan jadi merah jika sisa <= 1 hari
            setIsLoaded(true);
        }, 1000);

        return () => clearInterval(interval); // Matikan mesin jika user pindah halaman
    }, [expiryDate]);

    // Jangan tampilkan apa-apa sebelum angka siap berdetak
    if (status === 'loading' || !isLoaded) return null; 

    return (
        <div style={{
            backgroundColor: isWarning ? '#e74c3c' : '#1e3a8a', 
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
                ? `⚠️ PERINGATAN: Lisensi Berakhir Dalam ${timeLeft.days} Hari ${timeLeft.hours} Jam ${timeLeft.minutes} Menit ${timeLeft.seconds} Detik!`
                : `✅ Lisensi Premium Aktif | Sisa Waktu Anda: ${timeLeft.days} Hari ${timeLeft.hours} Jam ${timeLeft.minutes} Menit ${timeLeft.seconds} Detik`}
        </div>
    );
}