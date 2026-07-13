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
    // 🛡️ SATPAM PENGECEK LISENSI SUPABASE 🛡️
    async signIn({ user }) {
      const email = user.email;
      const emailKomandan = "ahmaddewi439@gmail.com";

      // 🌟 KARTU VIP KOMANDAN: Jika yang login adalah Admin, langsung buka pintu!
      if (email === emailKomandan) {
          console.log("Jenderal masuk! Bebaskan akses tanpa cek database!");
          return true;
      }

      // 1. Cek ke brankas Supabase untuk klien biasa
      const { data, error } = await supabase
          .from('user_access')
          .select('*')
          .eq('email', email)
          .single();

      if (error || !data) return '/?error=not_registered'; 
      if (data.access_status === 'PENDING') return '/?error=pending_activation';

      const expiryDate = new Date(data.trial_expires_at);
      const now = new Date();
      if (expiryDate < now) return '/?error=expired';

      return true;
    },

    // FITUR LAMA: PENGATURAN TOKEN & YOUTUBE
    async jwt({ token, account, user }: { token: any; account?: any; user?: any }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; 
        token.accessTokenExpires = account.expires_at * 1000; 
        
        const emailKomandan = "ahmaddewi439@gmail.com";

        // 🌟 JALUR VIP BANNER KOMANDAN: Beri lisensi abadi sampai tahun 2099!
        if (user.email === emailKomandan) {
             token.trial_expires_at = "2099-12-31T23:59:59.000Z";
        } else {
             // Bawa tanggal kedaluwarsa dari Supabase untuk user biasa
             const { data } = await supabase
               .from('user_access')
               .select('trial_expires_at')
               .eq('email', user.email)
               .single();
               
             token.trial_expires_at = data?.trial_expires_at;
        }

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
      session.trial_expires_at = token.trial_expires_at; 
      return session;
    }
  },
  pages: {
    signIn: '/', // Arahkan kembali ke halaman utama jika ditolak
  }
});

export { handler as GET, handler as POST };