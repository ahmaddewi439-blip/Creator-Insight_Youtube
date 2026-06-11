import { useEffect, useState } from 'react'
// 1. IMPORT KOMPONEN BARU ANDA DI SINI
import RobloxCreatorFinalUI from "@/src/components/RobloxCreatorFinalUI"; 

export default function VideoOptimizerPage() {
  // ... (kode logic bawaan halaman Anda yang sudah aman biarkan saja tetap di sini)

  return (
    // Bagian div ini otomatis dibungkus oleh layout menu utama Anda di tingkat atas
    <div style={{ padding: '20px' }}>
      
      {/* 2. CUKUP TEMPELKAN KOMPONEN DI SINI TANPA MERUSAK STRUKTUR DI LUARNYA */}
      <RobloxCreatorFinalUI />

    </div>
  )
}