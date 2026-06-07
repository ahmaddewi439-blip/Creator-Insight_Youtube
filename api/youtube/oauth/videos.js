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
        "Gagal refresh access token. Coba login YouTube ulang."
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
      data.error?.message || "Gagal membaca daftar video YouTube owner."
    );
  }

  return data;
}

function toNumber(value) {
  return Number(value || 0);
}

function getBestThumbnail(thumbnails) {
  if (!thumbnails) return "";

  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    ""
  );
}

function parseDurationToSeconds(duration = "") {
  const match = String(duration).match(
    /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  );

  if (!match) return 0;

  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(duration = "") {
  const totalSeconds = parseDurationToSeconds(duration);

  if (!totalSeconds) return "-";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getOwnerVideoStatus(video) {
  const status = video.status || {};
  const privacyStatus = status.privacyStatus || "unknown";
  const publishAt = status.publishAt || "";
  const uploadStatus = status.uploadStatus || "";
  const isFuturePublish = publishAt && new Date(publishAt).getTime() > Date.now();

  if (privacyStatus === "private" && isFuturePublish) {
    return {
      key: "scheduled",
      label: "Scheduled",
      text: `Terjadwal publish ${publishAt}`,
    };
  }

  if (privacyStatus === "public") {
    return {
      key: "published",
      label: "Published",
      text: "Sudah public",
    };
  }

  if (privacyStatus === "unlisted") {
    return {
      key: "unlisted",
      label: "Unlisted",
      text: "Unlisted",
    };
  }

  if (privacyStatus === "private") {
    return {
      key: "private",
      label: "Private",
      text: uploadStatus ? `Private • ${uploadStatus}` : "Private",
    };
  }

  return {
    key: privacyStatus || "unknown",
    label: privacyStatus || "Unknown",
    text: uploadStatus || "Status tidak diketahui",
  };
}

function buildSummary(videos) {
  const summary = {
    total: videos.length,
    published: 0,
    scheduled: 0,
    private: 0,
    unlisted: 0,
  };

  videos.forEach((video) => {
    if (summary[video.ownerStatusKey] !== undefined) {
      summary[video.ownerStatusKey] += 1;
    }
  });

  return summary;
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
      return res.status(401).json({
        loggedIn: false,
        message: "Belum login YouTube. Klik Login YouTube lalu coba lagi.",
      });
    }

    const maxResults = Math.min(
      Math.max(Number(req.query?.limit || 30), 1),
      50
    );

    const channelData = await youtubeRequest(
      "channels",
      {
        part: "snippet,statistics,contentDetails",
        mine: "true",
      },
      accessToken
    );

    const channel = channelData.items?.[0];

    if (!channel) {
      return res.status(404).json({
        loggedIn: true,
        message: "Channel YouTube tidak ditemukan di akun ini.",
      });
    }

    const searchData = await youtubeRequest(
      "search",
      {
        part: "id,snippet",
        forMine: "true",
        type: "video",
        order: "date",
        maxResults,
      },
      accessToken
    );

    const ids = (searchData.items || [])
      .map((item) => item.id?.videoId)
      .filter(Boolean)
      .slice(0, maxResults);

    if (ids.length === 0) {
      return res.status(200).json({
        loggedIn: true,
        channel: {
          id: channel.id,
          title: channel.snippet?.title || "Channel YouTube",
        },
        summary: buildSummary([]),
        videos: [],
      });
    }

    const videoData = await youtubeRequest(
      "videos",
      {
        part: "snippet,statistics,contentDetails,status",
        id: ids.join(","),
        maxResults: ids.length,
      },
      accessToken
    );

    const videos = (videoData.items || []).map((item) => {
      const snippet = item.snippet || {};
      const statistics = item.statistics || {};
      const contentDetails = item.contentDetails || {};
      const status = item.status || {};
      const ownerStatus = getOwnerVideoStatus(item);

      return {
        id: item.id,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        title: snippet.title || "Tanpa judul",
        description: snippet.description || "",
        thumbnail: getBestThumbnail(snippet.thumbnails),
        channelTitle: snippet.channelTitle || "",
        publishedAt: snippet.publishedAt || "",
        publishAt: status.publishAt || "",
        privacyStatus: status.privacyStatus || "unknown",
        uploadStatus: status.uploadStatus || "",
        license: status.license || "",
        embeddable: Boolean(status.embeddable),
        madeForKids: Boolean(status.madeForKids),
        ownerStatusKey: ownerStatus.key,
        ownerStatusLabel: ownerStatus.label,
        ownerStatusText: ownerStatus.text,
        duration: contentDetails.duration || "",
        durationText: formatDuration(contentDetails.duration),
        definition: contentDetails.definition || "",
        caption: contentDetails.caption || "false",
        tags: snippet.tags || [],
        viewCount: toNumber(statistics.viewCount),
        likeCount: toNumber(statistics.likeCount),
        commentCount: toNumber(statistics.commentCount),
      };
    });

    videos.sort((a, b) => {
      const aDate = new Date(a.publishAt || a.publishedAt || 0).getTime();
      const bDate = new Date(b.publishAt || b.publishedAt || 0).getTime();
      return bDate - aDate;
    });

    return res.status(200).json({
      loggedIn: true,
      channel: {
        id: channel.id,
        title: channel.snippet?.title || "Channel YouTube",
        handle: channel.snippet?.customUrl || "",
      },
      summary: buildSummary(videos),
      videos,
    });
  } catch (error) {
    return res.status(500).json({
      loggedIn: false,
      message: error.message || "Gagal membaca daftar video channel.",
    });
  }
};
