import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "../../../../lib/supabase"; // Import Brankas Supabase

// --- MESIN PENJAGA SESI (AUTO-REFRESH TOKEN) ---
async function refreshAccessToken(token: any) {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Gagal perpanjang sesi token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// --- KONFIGURASI UTAMA NEXTAUTH ---
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // 🛡️ FITUR BARU: SATPAM PENGECEK LISENSI SUPABASE 🛡️
    async signIn({ user }) {
      const email = user.email;

      // 1. Cek ke brankas Supabase
      const { data, error } = await supabase
          .from('user_access')
          .select('*')
          .eq('email', email)
          .single();

      // 2. Jika email tidak ada di database Admin, TOLAK!
      if (error || !data) {
          console.log("Akses Ditolak: Email tidak terdaftar di database Admin.");
          return '/?error=not_registered'; 
      }

      // 3. Jika statusnya masih PENDING, TOLAK!
      if (data.access_status === 'PENDING') {
          console.log("Akses Ditolak: Status masih PENDING.");
          return '/?error=pending_activation';
      }

      // 4. Cek apakah masa berlaku (Expired) sudah habis
      const expiryDate = new Date(data.trial_expires_at);
      const now = new Date();

      if (expiryDate < now) {
          console.log("Akses Ditolak: Lisensi kedaluwarsa.");
          return '/?error=expired';
      }

      // 5. Lolos semua ujian, IZINKAN MASUK! ✅
      return true;
    },

    // FITUR LAMA: PENGATURAN TOKEN & YOUTUBE
    async jwt({ token, account }: { token: any; account?: any }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; 
        token.accessTokenExpires = account.expires_at * 1000; 
        return token;
      }

      if (Date.now() < token.accessTokenExpires - 300000) {
        return token;
      }

      console.log("Tiket mati, mesin Auto-Refresh bekerja...");
      return refreshAccessToken(token);
    },
    async session({ session, token }: { session: any; token: any }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    }
  },
  pages: {
    signIn: '/', // Arahkan kembali ke halaman utama jika ditolak
  }
});

export { handler as GET, handler as POST };