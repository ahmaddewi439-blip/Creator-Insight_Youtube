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

async function refreshAccessToken(refreshToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const body = new URLSearchParams();

  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("refresh_token", refreshToken);
  body.set("grant_type", "refresh_token");

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
        "Gagal refresh access token."
    );
  }

  return data;
}

async function getValidAccessToken(req, res) {
  const cookies = parseCookies(req.headers.cookie || "");

  let accessToken = cookies.yt_access_token;
  const refreshToken = cookies.yt_refresh_token;
  const expiryTime = Number(cookies.yt_token_expiry || 0);
  const isExpired = !expiryTime || Date.now() > expiryTime - 60_000;

  if (accessToken && !isExpired) {
    return accessToken;
  }

  if (!refreshToken) {
    return null;
  }

  const refreshed = await refreshAccessToken(refreshToken);

  accessToken = refreshed.access_token;
  const expiresIn = Number(refreshed.expires_in || 3600);
  const newExpiryTime = String(Date.now() + expiresIn * 1000);

  res.setHeader("Set-Cookie", [
    serializeCookie("yt_access_token", accessToken, {
      path: "/",
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    }),

    serializeCookie("yt_token_expiry", newExpiryTime, {
      path: "/",
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    }),
  ]);

  return accessToken;
}

async function youtubeRequest(endpoint, params, accessToken) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Gagal membaca data YouTube milik user."
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

    const accessToken = await getValidAccessToken(req, res);

    if (!accessToken) {
      return res.status(200).json({
        loggedIn: false,
        message: "Belum login YouTube.",
      });
    }

    const data = await youtubeRequest(
      "channels",
      {
        part: "snippet,statistics,contentDetails",
        mine: "true",
      },
      accessToken
    );

    const channel = data.items?.[0];

    if (!channel) {
      return res.status(200).json({
        loggedIn: false,
        message: "Channel YouTube tidak ditemukan di akun ini.",
      });
    }

    const snippet = channel.snippet || {};
    const statistics = channel.statistics || {};
    const uploadsPlaylistId =
      channel.contentDetails?.relatedPlaylists?.uploads || "";

    return res.status(200).json({
      loggedIn: true,
      channel: {
        id: channel.id,
        title: snippet.title || "Channel YouTube",
        handle: snippet.customUrl || "",
        description: snippet.description || "",
        avatar:
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          "",
        publishedAt: snippet.publishedAt || "",
        subscriberCount: Number(statistics.subscriberCount || 0),
        hiddenSubscriberCount: Boolean(statistics.hiddenSubscriberCount),
        viewCount: Number(statistics.viewCount || 0),
        videoCount: Number(statistics.videoCount || 0),
        uploadsPlaylistId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      loggedIn: false,
      message: error.message || "Gagal mengecek login YouTube.",
    });
  }
};
