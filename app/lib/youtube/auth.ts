import type { NextAuthOptions, Session as NextAuthSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Extending session type
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          // FIX: Mengganti .readonly menjadi .force-ssl agar diizinkan mengubah judul/deskripsi
          scope: "openid email profile https://www.googleapis.com/auth/youtube.force-ssl"
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
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