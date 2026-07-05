import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// --- MESIN PENJAGA SESI (AUTO-REFRESH TOKEN) ---
// Bertugas menyogok Google meminta tiket baru di belakang layar
async function refreshAccessToken(token: any) {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken, // Pakai tiket sakti
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
      // Perpanjang waktu kematian token (1 jam lagi dari sekarang)
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // Jika Google kasih refresh token baru, pakai yang baru. Kalau tidak, pakai yang lama.
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
          // IZIN MUTLAK: Tanpa readonly, akses penuh ke YouTube
          scope: "openid email profile https://www.googleapis.com/auth/youtube",
          prompt: "consent",
          access_type: "offline", // PENTING: Memaksa Google ngasih Refresh Token
          response_type: "code"
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }: { token: any; account?: any }) {
      // 1. LOGIKA AWAL LOGIN (Saat pengguna baru saja sukses login)
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; // Simpan tiket sakti!
        token.accessTokenExpires = account.expires_at * 1000; // Catat jam kematiannya
        return token;
      }

      // 2. SESI MASIH AMAN: Jika waktu sekarang < waktu mati (beri jeda 5 menit untuk amannya)
      if (Date.now() < token.accessTokenExpires - 300000) {
        return token;
      }

      // 3. SESI HANGUS: Jalankan mesin auto-refresh secara diam-diam!
      console.log("Tiket mati, mesin Auto-Refresh bekerja...");
      return refreshAccessToken(token);
    },
    async session({ session, token }: { session: any; token: any }) {
      // Oper token baru ke bagian depan website
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    }
  }
});

export { handler as GET, handler as POST };