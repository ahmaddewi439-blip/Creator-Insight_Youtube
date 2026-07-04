import type { NextAuthOptions, Session as NextAuthSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Extending session type
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
  }
}

/**
 * Fungsi Rahasia: Menukarkan Kunci Serep (Refresh Token) 
 * dengan Kunci Utama (Access Token) yang baru ke server Google.
 */
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
      // Google memberikan expiresIn dalam detik, kita ubah ke milidetik
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // Gunakan refresh token yang baru jika diberikan, jika tidak gunakan yang lama
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Gagal memperbarui access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
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
    async jwt({ token, account }) {
      // 1. Saat user PERTAMA KALI login
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; // Tangkap kunci serep
        // Simpan kapan token ini akan mati (dalam milidetik)
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000;
        return token;
      }

      // 2. Jika user kembali ke web dan token MASIH HIDUP (belum kedaluwarsa)
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // 3. Jika token SUDAH MATI, jalankan mesin auto-refresh secara diam-diam
      return refreshAccessToken(token);
    },
    
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      return session;
    }
  }
};

export function getAuth() {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY belum diisi");
  }
  return process.env.YOUTUBE_API_KEY;
}