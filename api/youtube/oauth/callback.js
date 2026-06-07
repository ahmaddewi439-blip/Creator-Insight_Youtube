function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf("=");

      if (index === -1) return cookies;

      const key = part.slice(0, index);
      const value = decodeURIComponent(part.slice(index + 1));

      cookies[key] = value;
      return cookies;
    }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);

  return parts.join("; ");
}

async function exchangeCodeForToken(code) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  const body = new URLSearchParams();

  body.set("code", code);
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("redirect_uri", redirectUri);
  body.set("grant_type", "authorization_code");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error_description ||
        data.error ||
        "Gagal menukar OAuth code menjadi access token."
    );
  }

  return data;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        message: "Method tidak diizinkan.",
      });
    }

    const { code, state, error } = req.query || {};

    if (error) {
      return res.redirect(
        302,
        `/?youtubeLogin=error&message=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return res.redirect(
        302,
        "/?youtubeLogin=error&message=OAuth code tidak ditemukan"
      );
    }

    const cookies = parseCookies(req.headers.cookie || "");
    const savedState = cookies.yt_oauth_state;

    if (!savedState || savedState !== state) {
      return res.redirect(
        302,
        "/?youtubeLogin=error&message=OAuth state tidak valid"
      );
    }

    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.GOOGLE_REDIRECT_URI
    ) {
      return res.status(500).json({
        message:
          "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, atau GOOGLE_REDIRECT_URI belum lengkap.",
      });
    }

    const tokenData = await exchangeCodeForToken(code);

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || "";
    const expiresIn = Number(tokenData.expires_in || 3600);
    const expiryTime = String(Date.now() + expiresIn * 1000);

    const cookieList = [
      serializeCookie("yt_oauth_state", "", {
        path: "/",
        maxAge: 0,
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      }),

      serializeCookie("yt_access_token", accessToken, {
        path: "/",
        maxAge: expiresIn,
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      }),

      serializeCookie("yt_token_expiry", expiryTime, {
        path: "/",
        maxAge: expiresIn,
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      }),
    ];

    if (refreshToken) {
      cookieList.push(
        serializeCookie("yt_refresh_token", refreshToken, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
        })
      );
    }

    res.setHeader("Set-Cookie", cookieList);

    return res.redirect(302, "/?youtubeLogin=success#videoBoosterSection");
  } catch (error) {
    return res.redirect(
      302,
      `/?youtubeLogin=error&message=${encodeURIComponent(
        error.message || "OAuth callback gagal"
      )}`
    );
  }
};
