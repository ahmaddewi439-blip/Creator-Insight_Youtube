const crypto = require("crypto");

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);

  return parts.join("; ");
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        message: "Method tidak diizinkan.",
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const scopes =
      process.env.YOUTUBE_OAUTH_SCOPES ||
      "https://www.googleapis.com/auth/youtube";

    if (!clientId || !redirectUri) {
      return res.status(500).json({
        message:
          "GOOGLE_CLIENT_ID atau GOOGLE_REDIRECT_URI belum diisi di Vercel.",
      });
    }

    const state = crypto.randomBytes(24).toString("hex");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("include_granted_scopes", "true");
    authUrl.searchParams.set("state", state);

    res.setHeader(
      "Set-Cookie",
      serializeCookie("yt_oauth_state", state, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
        maxAge: 600,
      })
    );

    return res.redirect(302, authUrl.toString());
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Gagal memulai OAuth YouTube.",
    });
  }
};
