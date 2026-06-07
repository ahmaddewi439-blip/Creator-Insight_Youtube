const form = document.getElementById("analyzeForm");
const inputSection = document.getElementById("inputSection");
const loadingSection = document.getElementById("loadingSection");
const resultSection = document.getElementById("resultSection");
const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");
const loadingText = document.getElementById("loadingText");

const backBtn = document.getElementById("backBtn");
const backFromError = document.getElementById("backFromError");
const copyResultBtn = document.getElementById("copyResultBtn");
const copyArea = document.getElementById("copyArea");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const videoBoosterForm = document.getElementById("videoBoosterForm");
const videoUrlInput = document.getElementById("videoUrlInput");
const videoBoosterLoading = document.getElementById("videoBoosterLoading");
const videoBoosterResult = document.getElementById("videoBoosterResult");
const videoBoosterError = document.getElementById("videoBoosterError");
const videoBoosterErrorMessage = document.getElementById("videoBoosterErrorMessage");
const copyVideoDescriptionBtn = document.getElementById("copyVideoDescriptionBtn");
const youtubeLoginCard = document.getElementById("youtubeLoginCard");
const youtubeLoginTitle = document.getElementById("youtubeLoginTitle");
const youtubeLoginText = document.getElementById("youtubeLoginText");
const checkYoutubeLoginBtn = document.getElementById("checkYoutubeLoginBtn");

const ownerChannelCard = document.getElementById("ownerChannelCard");
const ownerChannelAvatar = document.getElementById("ownerChannelAvatar");
const ownerChannelTitle = document.getElementById("ownerChannelTitle");
const ownerChannelHandle = document.getElementById("ownerChannelHandle");
const ownerChannelStats = document.getElementById("ownerChannelStats");
const loadOwnerVideosBtn = document.getElementById("loadOwnerVideosBtn");
const refreshOwnerVideosBtn = document.getElementById("refreshOwnerVideosBtn");
const ownerVideosPanel = document.getElementById("ownerVideosPanel");
const ownerVideosSummary = document.getElementById("ownerVideosSummary");
const ownerVideoList = document.getElementById("ownerVideoList");
const ownerTotalVideos = document.getElementById("ownerTotalVideos");
const ownerPublishedVideos = document.getElementById("ownerPublishedVideos");
const ownerScheduledVideos = document.getElementById("ownerScheduledVideos");
const ownerPrivateVideos = document.getElementById("ownerPrivateVideos");
const analyzeOwnerGrowthBtn = document.getElementById("analyzeOwnerGrowthBtn");
const ownerGrowthPanel = document.getElementById("ownerGrowthPanel");
const ownerGrowthLoading = document.getElementById("ownerGrowthLoading");
const ownerGrowthResult = document.getElementById("ownerGrowthResult");
const ownerGrowthError = document.getElementById("ownerGrowthError");
const ownerGrowthErrorMessage = document.getElementById("ownerGrowthErrorMessage");
const ownerGrowthAiStatus = document.getElementById("ownerGrowthAiStatus");
const ownerGrowthTitle = document.getElementById("ownerGrowthTitle");
const ownerGrowthText = document.getElementById("ownerGrowthText");
const ownerGrowthScore = document.getElementById("ownerGrowthScore");
const ownerGrowthTrend = document.getElementById("ownerGrowthTrend");
const ownerGrowthEngagement = document.getElementById("ownerGrowthEngagement");
const ownerGrowthConsistency = document.getElementById("ownerGrowthConsistency");
const ownerGrowthBestVideo = document.getElementById("ownerGrowthBestVideo");
const ownerGrowthCauses = document.getElementById("ownerGrowthCauses");
const ownerGrowthRecommendations = document.getElementById("ownerGrowthRecommendations");
const ownerGrowthActionPlan = document.getElementById("ownerGrowthActionPlan");
const ownerGrowthIdeas = document.getElementById("ownerGrowthIdeas");
const ownerScheduleAdvice = document.getElementById("ownerScheduleAdvice");
const ownerScheduledReview = document.getElementById("ownerScheduledReview");
const copyOwnerGrowthReportBtn = document.getElementById("copyOwnerGrowthReportBtn");
let lastAnalysisData = null;
let lastResultText = "";
let lastOwnerVideosData = null;
let lastOwnerGrowthReport = "";
let lastOwnerGrowthData = null;
let lastOwnerV5Report = "";

function show(section) {
  inputSection.classList.add("hidden");
  loadingSection.classList.add("hidden");
  resultSection.classList.add("hidden");
  errorBox.classList.add("hidden");
  section.classList.remove("hidden");
}

function formatNumber(value) {
  const n = Number(value || 0);

  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";

  return n.toLocaleString("id-ID");
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatDate(dateString) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setImage(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src || "";
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function startLoadingAnimation() {
  const steps = [
    ["Membaca profil channel YouTube...", "step1"],
    ["Mengambil video terbaru...", "step2"],
    ["Menganalisa SEO, judul, dan keyword...", "step3"],
    ["Membandingkan kompetitor...", "step4"],
    ["Menyusun action plan...", "step5"],
  ];

  steps.forEach(([, id]) => {
    document.getElementById(id)?.classList.remove("active");
  });

  let index = 0;
  loadingText.textContent = steps[index][0];
  document.getElementById(steps[index][1])?.classList.add("active");

  return setInterval(() => {
    index = (index + 1) % steps.length;
    loadingText.textContent = steps[index][0];
    document.getElementById(steps[index][1])?.classList.add("active");
  }, 900);
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.classList.remove("active");
      });

      document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.classList.remove("active");
      });

      button.classList.add("active");
      document.getElementById(button.dataset.tab)?.classList.add("active");
    });
  });
}

function buildChart(videos) {
  const chart = document.getElementById("miniChart");
  chart.innerHTML = "";

  if (!videos || videos.length === 0) {
    chart.innerHTML = `<div style="margin:auto;color:var(--muted)">Belum ada data video.</div>`;
    return;
  }

  const ordered = [...videos].reverse();
  const maxViews = Math.max(...ordered.map((v) => Number(v.viewCount || 0)), 1);

  ordered.forEach((video) => {
    const bar = document.createElement("div");
    const height = Math.max((Number(video.viewCount || 0) / maxViews) * 100, 7);

    bar.className = "chart-bar";
    bar.style.height = `${height}%`;
    bar.title = `${video.title} - ${formatNumber(video.viewCount)} views`;

    chart.appendChild(bar);
  });
}

function renderVideoCard(prefix, video) {
  setImage(`${prefix}VideoThumb`, video?.thumbnail || "");
  setText(`${prefix}VideoTitle`, video?.title || "-");

  setText(
    `${prefix}VideoStats`,
    video
      ? `${formatNumber(video.viewCount)} views • ${formatNumber(video.likeCount)} likes • ${formatNumber(video.commentCount)} komentar`
      : "-"
  );

  setText(`${prefix}VideoReason`, video?.reason || "-");
}

function renderList(id, items) {
  const box = document.getElementById(id);
  box.innerHTML = "";

  if (!items || items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "list-item";
    empty.textContent = "Belum ada data.";
    box.appendChild(empty);
    return;
  }

  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.textContent = `${index + 1}. ${item}`;
    box.appendChild(div);
  });
}

function renderKeywords(id, items) {
  const box = document.getElementById(id);
  box.innerHTML = "";

  if (!items || items.length === 0) {
    const empty = document.createElement("span");
    empty.className = "keyword";
    empty.textContent = "Belum ada keyword";
    box.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const span = document.createElement("span");
    span.className = "keyword";
    span.textContent =
      typeof item === "string" ? item : `${item.keyword} (${item.count})`;
    box.appendChild(span);
  });
}

function renderVideoAudit(videos) {
  const tbody = document.getElementById("videoAuditBody");
  tbody.innerHTML = "";

  if (!videos || videos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">Belum ada video untuk dianalisa.</td></tr>`;
    return;
  }

  videos.forEach((video) => {
    const labelClass =
      video.label === "Winner"
        ? "winner"
        : video.label === "Weak"
        ? "weak"
        : "normal";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <div class="video-title-cell">
          <img src="${video.thumbnail || ""}" alt="">
          <div>
            <strong>${escapeHtml(video.title)}</strong>
            <small>${video.ageDays} hari lalu</small>
          </div>
        </div>
      </td>
      <td>${formatNumber(video.viewCount)}</td>
      <td>${formatNumber(video.viewsPerDay)}/hari</td>
      <td>${formatPercent(video.engagementRate)}</td>
      <td>${video.seoScore}/100</td>
      <td>${video.titleScore}/100</td>
      <td><span class="label ${labelClass}">${video.label}</span></td>
    `;

    tbody.appendChild(tr);
  });
}

function renderCompetitors(competitors, mainData) {
  const box = document.getElementById("competitorPanel");
  box.innerHTML = "";

  if (!competitors || competitors.length === 0) {
    box.innerHTML = `
      <div class="panel-card full">
        <h3>Belum ada kompetitor</h3>
        <p>Masukkan 1-3 channel kompetitor di form awal untuk menampilkan perbandingan channel utama dengan kompetitor.</p>
      </div>
    `;
    return;
  }

  const mainAvgViews = Number(mainData?.summary?.averageViews || 0);
  const mainHealth = Number(mainData?.summary?.healthScore || 0);

  competitors.forEach((comp) => {
        if (comp.failed) {
      const card = document.createElement("div");
      card.className = "competitor-card pro failed";

      card.innerHTML = `
        <div class="competitor-head">
          <div class="competitor-profile">
            <div class="competitor-placeholder">!</div>
            <div>
              <h4>${escapeHtml(comp.channel?.title || "Kompetitor gagal dibaca")}</h4>
              <p>Data tidak tersedia</p>
            </div>
          </div>

          <span class="competitor-status lose">
            Gagal Dibaca
          </span>
        </div>

        <div class="gap-box">
          <span>Error Detail</span>
          <p>${escapeHtml(comp.errorMessage || comp.gapInsight || "Tidak ada detail error.")}</p>
        </div>

        <div class="action-mini-list">
          <span>Solusi Cepat</span>
          <ul>
            <li>Coba pakai handle pendek, contoh: @markrober</li>
            <li>Coba pakai Channel ID jika handle gagal.</li>
            <li>Cek quota YouTube API di Google Cloud.</li>
          </ul>
        </div>
      `;

      box.appendChild(card);
      return;
    }
    const compAvgViews = Number(comp.summary?.averageViews || 0);
    const compHealth = Number(comp.summary?.healthScore || 0);

    let statusClass = "equal";
    let statusText = "Seimbang";

    if (compAvgViews > mainAvgViews * 1.25) {
      statusClass = "lose";
      statusText = "Kompetitor Lebih Kuat";
    } else if (mainAvgViews > compAvgViews * 1.25) {
      statusClass = "win";
      statusText = "Channel Kamu Unggul";
    }

    const viewGap =
      mainAvgViews > 0
        ? (((compAvgViews - mainAvgViews) / mainAvgViews) * 100).toFixed(1)
        : "0.0";

    const topVideoTitle = comp.topVideo?.title || "-";
    const topVideoViews = comp.topVideo?.viewCount
      ? formatNumber(comp.topVideo.viewCount)
      : "-";

    const topVideoVph = comp.topVideo?.viewsPerDay
      ? `${formatNumber(comp.topVideo.viewsPerDay)}/hari`
      : "-";

    const card = document.createElement("div");
    card.className = "competitor-card pro";

    card.innerHTML = `
      <div class="competitor-head">
        <div class="competitor-profile">
          <img src="${comp.channel.avatar || ""}" alt="">
          <div>
            <h4>${escapeHtml(comp.channel.title)}</h4>
            <p>${escapeHtml(comp.channel.handle || comp.channel.id || "")}</p>
          </div>
        </div>

        <span class="competitor-status ${statusClass}">
          ${statusText}
        </span>
      </div>

      <div class="competitor-metrics">
        <div class="competitor-metric">
          <span>Subscriber</span>
          <strong>${comp.channel.hiddenSubscriberCount ? "Hidden" : formatNumber(comp.channel.subscriberCount)}</strong>
        </div>

        <div class="competitor-metric">
          <span>Avg Views</span>
          <strong>${formatNumber(compAvgViews)}</strong>
          <small>${viewGap}% vs channel utama</small>
        </div>

        <div class="competitor-metric">
          <span>Health Score</span>
          <strong>${compHealth}/100</strong>
          <small>Main: ${mainHealth}/100</small>
        </div>
      </div>

      <div class="top-video-box">
        <span>Top Video Kompetitor</span>
        <strong>${escapeHtml(topVideoTitle)}</strong>
        <p>${topVideoViews} views • ${topVideoVph}</p>
      </div>

      <div class="gap-box">
        <span>AI Gap Insight</span>
        <p>${escapeHtml(comp.gapInsight || "-")}</p>
      </div>

      <div class="action-mini-list">
        <span>Action Cepat</span>
        <ul>
          <li>Bandingkan judul top video kompetitor dengan video terbaik channel utama.</li>
          <li>Ambil angle topik yang mirip, tapi buat hook dan value yang berbeda.</li>
          <li>Gunakan format kompetitor yang menang sebagai inspirasi, bukan copy mentah.</li>
        </ul>
      </div>
    `;

    box.appendChild(card);
  });
}

function buildReport(data) {
  return `
CREATOR INSIGHT PRO V3 REPORT

CHANNEL:
${data.channel.title}
${data.channel.handle || data.channel.id}

AI STATUS:
${data.aiStatus || "manual"}

METRICS:
Subscriber: ${data.channel.hiddenSubscriberCount ? "Hidden" : formatNumber(data.channel.subscriberCount)}
Total Views: ${formatNumber(data.channel.viewCount)}
Total Videos: ${formatNumber(data.channel.videoCount)}
Health Score: ${data.summary.healthScore}/100

SCORES:
Growth: ${data.scores.growth}/100
Engagement: ${data.scores.engagement}/100
Consistency: ${data.scores.consistency}/100
SEO: ${data.scores.seo}/100
Viral Potential: ${data.scores.viral}/100

DIAGNOSIS:
${data.diagnosis.title}
${data.diagnosis.text}

BEST VIDEO:
${data.videos.best?.title || "-"}
${data.videos.best ? formatNumber(data.videos.best.viewCount) + " views" : ""}

WEAK VIDEO:
${data.videos.weakest?.title || "-"}
${data.videos.weakest ? formatNumber(data.videos.weakest.viewCount) + " views" : ""}

KEYWORDS:
${(data.keywords.main || []).map((k) => typeof k === "string" ? k : k.keyword).join(", ")}

RECOMMENDATIONS:
${(data.recommendations || []).map((x, i) => `${i + 1}. ${x}`).join("\n")}

SEO SUGGESTIONS:
${(data.seoSuggestions || []).map((x, i) => `${i + 1}. ${x}`).join("\n")}

TITLE FORMULA:
${(data.titleFormulas || []).map((x, i) => `${i + 1}. ${x}`).join("\n")}

ACTION PLAN:
${(data.actionPlan || []).map((x, i) => `${i + 1}. ${x}`).join("\n")}

CONTENT IDEAS:
${(data.ideas || []).map((x, i) => `${i + 1}. ${x}`).join("\n")}
  `.trim();
}

function buildPdfHtml(data) {
  const keywords = (data.keywords?.main || [])
    .map((item) => (typeof item === "string" ? item : item.keyword))
    .join(", ");

  const listHtml = (items) => {
    return (items || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
  };

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Creator Insight Report - ${escapeHtml(data.channel.title)}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #102018;
      background: #ffffff;
      padding: 36px;
      line-height: 1.6;
    }

    .header {
      border-bottom: 4px solid #00a66a;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }

    .brand {
      color: #00a66a;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    h1 {
      margin: 6px 0 4px;
      font-size: 30px;
    }

    h2 {
      margin-top: 28px;
      color: #006b45;
      border-bottom: 1px solid #d7efe5;
      padding-bottom: 6px;
    }

    .muted {
      color: #5c756b;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 18px 0;
    }

    .card {
      border: 1px solid #d7efe5;
      border-radius: 12px;
      padding: 14px;
      background: #f6fffb;
    }

    .card span {
      display: block;
      color: #5c756b;
      font-size: 12px;
      margin-bottom: 6px;
    }

    .card strong {
      font-size: 20px;
      color: #00452f;
    }

    .diagnosis {
      padding: 18px;
      border-left: 5px solid #00a66a;
      background: #f6fffb;
      border-radius: 12px;
    }

    li {
      margin-bottom: 8px;
    }

    .footer {
      margin-top: 34px;
      font-size: 12px;
      color: #6b7d75;
      border-top: 1px solid #d7efe5;
      padding-top: 12px;
    }

    @media print {
      body {
        padding: 18px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Creator Insight Pro V3</div>
    <h1>${escapeHtml(data.channel.title)}</h1>
    <div class="muted">${escapeHtml(data.channel.handle || data.channel.id)} • AI Status: ${escapeHtml(data.aiStatus || "manual")}</div>
  </div>

  <div class="grid">
    <div class="card">
      <span>Subscriber</span>
      <strong>${data.channel.hiddenSubscriberCount ? "Hidden" : formatNumber(data.channel.subscriberCount)}</strong>
    </div>
    <div class="card">
      <span>Total Views</span>
      <strong>${formatNumber(data.channel.viewCount)}</strong>
    </div>
    <div class="card">
      <span>Total Video</span>
      <strong>${formatNumber(data.channel.videoCount)}</strong>
    </div>
    <div class="card">
      <span>Health Score</span>
      <strong>${data.summary.healthScore}/100</strong>
    </div>
  </div>

  <h2>Diagnosis</h2>
  <div class="diagnosis">
    <strong>${escapeHtml(data.diagnosis.title)}</strong>
    <p>${escapeHtml(data.diagnosis.text)}</p>
  </div>

  <h2>Score Detail</h2>
  <div class="grid">
    <div class="card"><span>Growth</span><strong>${data.scores.growth}/100</strong></div>
    <div class="card"><span>Engagement</span><strong>${data.scores.engagement}/100</strong></div>
    <div class="card"><span>Consistency</span><strong>${data.scores.consistency}/100</strong></div>
    <div class="card"><span>SEO</span><strong>${data.scores.seo}/100</strong></div>
  </div>

  <h2>Keyword Utama</h2>
  <p>${escapeHtml(keywords || "-")}</p>

  <h2>Rekomendasi Pro</h2>
  <ol>${listHtml(data.recommendations)}</ol>

  <h2>Saran SEO</h2>
  <ol>${listHtml(data.seoSuggestions)}</ol>

  <h2>Title Formula</h2>
  <ol>${listHtml(data.titleFormulas)}</ol>

  <h2>Action Plan 7 Hari</h2>
  <ol>${listHtml(data.actionPlan)}</ol>

  <h2>Ide Konten Berikutnya</h2>
  <ol>${listHtml(data.ideas)}</ol>

  <div class="footer">
    Laporan ini dibuat menggunakan data publik YouTube dan AI report dari Creator Insight Pro V3.
    Data private seperti CTR, retention, watch time, dan demografi audience tidak termasuk.
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;
}

function renderResult(data) {
  setImage("channelAvatar", data.channel.avatar);
  setText("channelTitle", data.channel.title);
  setText("channelHandle", data.channel.handle || data.channel.id);
  setText("channelPublished", `Bergabung ${formatDate(data.channel.publishedAt)}`);

  setText(
    "subscriberCount",
    data.channel.hiddenSubscriberCount
      ? "Hidden"
      : formatNumber(data.channel.subscriberCount)
  );

  setText("viewCount", formatNumber(data.channel.viewCount));
  setText("videoCount", formatNumber(data.channel.videoCount));
  setText("healthScore", `${data.summary.healthScore}/100`);

  const aiStatusBadge = document.getElementById("aiStatusBadge");

  if (aiStatusBadge) {
    aiStatusBadge.classList.remove("gemini", "manual");

    if (data.aiStatus === "gemini") {
      aiStatusBadge.textContent = "AI Gemini Active";
      aiStatusBadge.classList.add("gemini");
    } else {
      aiStatusBadge.textContent = "Manual Fallback";
      aiStatusBadge.classList.add("manual");
    }
  }
const modeStatusBadge = document.getElementById("modeStatusBadge");

if (modeStatusBadge) {
  const modeName = data.mode?.name || "Lite";

  modeStatusBadge.classList.remove("lite", "pro", "max");
  modeStatusBadge.textContent = `Mode Active: ${modeName}`;

  if (modeName.toLowerCase() === "lite") {
    modeStatusBadge.classList.add("lite");
  } else if (modeName.toLowerCase() === "pro") {
    modeStatusBadge.classList.add("pro");
  } else {
    modeStatusBadge.classList.add("max");
  }
}
  setText("growthScore", `${data.scores.growth}/100`);
  setText("engagementScore", `${data.scores.engagement}/100`);
  setText("consistencyScore", `${data.scores.consistency}/100`);
  setText("seoScore", `${data.scores.seo}/100`);
  setText("viralScore", `${data.scores.viral}/100`);

  setText("growthStatus", data.summary.growthStatus);
  setText("engagementRate", `Engagement ${formatPercent(data.summary.engagementRate)}`);
  setText("uploadGap", `Gap upload ${data.summary.avgUploadGapDays} hari`);
  setText("outlierCount", `${data.summary.outlierCount} outlier video`);

  setText("diagnosisTitle", data.diagnosis.title);
  setText("diagnosisText", data.diagnosis.text);

  setText(
    "avgViewsText",
    `Rata-rata view ${data.summary.analyzedVideos} video terakhir: ${formatNumber(data.summary.averageViews)}`
  );

  setText(
    "trendPill",
    `${data.summary.growthStatus} ${Number(data.summary.growthPercentage || 0).toFixed(1)}%`
  );

  renderVideoCard("best", data.videos.best);
  renderVideoCard("weak", data.videos.weakest);

  buildChart(data.videos.items);
  renderVideoAudit(data.videos.items);

  renderKeywords("mainKeywords", data.keywords.main);
  renderKeywords("winningKeywords", data.keywords.winning);
  renderKeywords("weakKeywords", data.keywords.weak);

  renderList("seoSuggestions", data.seoSuggestions);
  renderList("titleFormulas", data.titleFormulas);
  renderList("recommendationList", data.recommendations);
  renderList("actionPlan", data.actionPlan);
  renderList("contentIdeas", data.ideas);

  renderCompetitors(data.competitors, data);

  lastAnalysisData = data;
  lastResultText = buildReport(data);
  copyArea.value = lastResultText;

  show(resultSection);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const channelInput = document.getElementById("channelInput").value.trim();
  const competitorRaw = document.getElementById("competitorInput").value.trim();
  const videoLimit = Number(
    document.querySelector("input[name='videoLimit']:checked").value
  );

  if (!channelInput) {
    errorMessage.textContent = "Masukkan channel utama terlebih dahulu.";
    show(errorBox);
    return;
  }

  const competitors = competitorRaw
    ? competitorRaw
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  show(loadingSection);
  const interval = startLoadingAnimation();

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelInput,
        competitors,
        videoLimit,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gagal menganalisa channel.");
    }

    clearInterval(interval);
    renderResult(data);
  } catch (error) {
    clearInterval(interval);
    errorMessage.textContent = error.message || "Terjadi kesalahan.";
    show(errorBox);
  }
});

backBtn.addEventListener("click", () => {
  show(inputSection);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

backFromError.addEventListener("click", () => {
  show(inputSection);
});

copyResultBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(lastResultText);
    copyResultBtn.textContent = "Report Dicopy";

    setTimeout(() => {
      copyResultBtn.textContent = "Copy Report";
    }, 1600);
  } catch {
    copyArea.classList.remove("hidden");
    copyArea.select();
    document.execCommand("copy");
    copyArea.classList.add("hidden");
  }
});

downloadPdfBtn?.addEventListener("click", () => {
  if (!lastAnalysisData) {
    alert("Belum ada data analisa untuk dibuat PDF.");
    return;
  }

  const pdfWindow = window.open("", "_blank");

  if (!pdfWindow) {
    alert("Popup diblokir browser. Izinkan popup untuk download PDF.");
    return;
  }

  pdfWindow.document.open();
  pdfWindow.document.write(buildPdfHtml(lastAnalysisData));
  pdfWindow.document.close();
});
function showVideoBoosterState(state) {
  videoBoosterLoading?.classList.add("hidden");
  videoBoosterResult?.classList.add("hidden");
  videoBoosterError?.classList.add("hidden");

  if (state === "loading") {
    videoBoosterLoading?.classList.remove("hidden");
  }

  if (state === "result") {
    videoBoosterResult?.classList.remove("hidden");
  }

  if (state === "error") {
    videoBoosterError?.classList.remove("hidden");
  }
}

function renderBoosterKeywords(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!items || items.length === 0) {
    const span = document.createElement("span");
    span.className = "keyword";
    span.textContent = "Belum ada data";
    container.appendChild(span);
    return;
  }

  items.forEach((item) => {
    const span = document.createElement("span");
    span.className = "keyword";
    span.textContent = item;
    container.appendChild(span);
  });
}

function renderBoosterNotes(notes) {
  const box = document.getElementById("boosterNotes");
  if (!box) return;

  box.innerHTML = "";

  if (!notes || notes.length === 0) {
    const div = document.createElement("div");
    div.className = "list-item";
    div.textContent = "Belum ada catatan.";
    box.appendChild(div);
    return;
  }

  notes.forEach((note, index) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.textContent = `${index + 1}. ${note}`;
    box.appendChild(div);
  });
}

function renderVideoBoosterResult(data) {
  const video = data.video;

  setImage("boosterThumb", video.thumbnail || "");
  setText("boosterTitle", video.title || "-");
  setText("boosterChannel", video.channelTitle || "-");
  setText("boosterPublished", `Upload: ${formatDate(video.publishedAt)}`);

  setText("boosterViews", formatNumber(video.viewCount));
  setText("boosterLikes", formatNumber(video.likeCount));
  setText("boosterComments", formatNumber(video.commentCount));
  setText("boosterScore", `${data.launchScore}/100`);

  renderBoosterKeywords("boosterHashtags", data.hashtags);
  renderBoosterKeywords("boosterKeywords", data.keywords);
  renderBoosterNotes(data.notes);

  const descBox = document.getElementById("boosterDescription");
  if (descBox) {
    descBox.value = video.description || "";
  }

  showVideoBoosterState("result");
}

videoBoosterForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const videoUrl = videoUrlInput?.value.trim();

  if (!videoUrl) {
    if (videoBoosterErrorMessage) {
      videoBoosterErrorMessage.textContent = "Masukkan link video YouTube terlebih dahulu.";
    }

    showVideoBoosterState("error");
    return;
  }

  showVideoBoosterState("loading");

  try {
    const response = await fetch("/api/video-booster", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gagal membaca video.");
    }

    renderVideoBoosterResult(data);
  } catch (error) {
    if (videoBoosterErrorMessage) {
      videoBoosterErrorMessage.textContent =
        error.message || "Terjadi kesalahan saat membaca video.";
    }

    showVideoBoosterState("error");
  }
});

copyVideoDescriptionBtn?.addEventListener("click", async () => {
  const descBox = document.getElementById("boosterDescription");

  if (!descBox || !descBox.value.trim()) {
    alert("Deskripsi video masih kosong.");
    return;
  }

  try {
    await navigator.clipboard.writeText(descBox.value);
    copyVideoDescriptionBtn.textContent = "Deskripsi Dicopy";

    setTimeout(() => {
      copyVideoDescriptionBtn.textContent = "Copy Deskripsi";
    }, 1500);
  } catch {
    descBox.select();
    document.execCommand("copy");
  }
});
function setYoutubeLoginState(type, title, text) {
  if (!youtubeLoginCard) return;

  youtubeLoginCard.classList.remove("success", "error");

  if (type) {
    youtubeLoginCard.classList.add(type);
  }

  if (youtubeLoginTitle) {
    youtubeLoginTitle.textContent = title;
  }

  if (youtubeLoginText) {
    youtubeLoginText.textContent = text;
  }
}

function renderOwnerChannel(channel) {
  if (!channel) return;

  ownerChannelCard?.classList.remove("hidden");

  if (ownerChannelAvatar) {
    ownerChannelAvatar.src = channel.avatar || "";
  }

  if (ownerChannelTitle) {
    ownerChannelTitle.textContent = channel.title || "Channel YouTube";
  }

  if (ownerChannelHandle) {
    ownerChannelHandle.textContent = channel.handle || channel.id || "";
  }

  if (ownerChannelStats) {
    const subscriberText = channel.hiddenSubscriberCount
      ? "Subscriber hidden"
      : `${formatNumber(channel.subscriberCount)} subscriber`;

    ownerChannelStats.textContent =
      `${subscriberText} • ${formatNumber(channel.viewCount)} views • ${formatNumber(channel.videoCount)} video`;
  }
}

function setOwnerVideoLoading(isLoading) {
  if (loadOwnerVideosBtn) {
    loadOwnerVideosBtn.disabled = isLoading;
    loadOwnerVideosBtn.textContent = isLoading
      ? "Membaca Video..."
      : "Baca 50 Video Channel Saya";
  }

  if (refreshOwnerVideosBtn) {
    refreshOwnerVideosBtn.disabled = isLoading;
    refreshOwnerVideosBtn.textContent = isLoading ? "Membaca..." : "Refresh Video";
  }
}

function renderOwnerVideoEmpty(message) {
  ownerVideosPanel?.classList.remove("hidden");

  if (ownerVideoList) {
    ownerVideoList.innerHTML = `<div class="owner-video-empty">${escapeHtml(message)}</div>`;
  }
}

function renderOwnerVideoStats(summary) {
  const published = Number(summary?.published || 0);
  const scheduled = Number(summary?.scheduled || 0);
  const privateCount = Number(summary?.private || 0);
  const unlisted = Number(summary?.unlisted || 0);

  if (ownerTotalVideos) ownerTotalVideos.textContent = formatNumber(summary?.total || 0);
  if (ownerPublishedVideos) ownerPublishedVideos.textContent = formatNumber(published);
  if (ownerScheduledVideos) ownerScheduledVideos.textContent = formatNumber(scheduled);
  if (ownerPrivateVideos) ownerPrivateVideos.textContent = formatNumber(privateCount + unlisted);
}

function renderOwnerVideos(data) {
  ownerVideosPanel?.classList.remove("hidden");
  renderOwnerVideoStats(data.summary || {});

  const total = Number(data.summary?.total || 0);
  const scheduled = Number(data.summary?.scheduled || 0);
  const privateCount = Number(data.summary?.private || 0);
  const unlisted = Number(data.summary?.unlisted || 0);

  if (ownerVideosSummary) {
    ownerVideosSummary.textContent =
      `Terbaca ${formatNumber(total)} video terbaru. Scheduled: ${formatNumber(scheduled)} • Private/Unlisted: ${formatNumber(privateCount + unlisted)}. Data ini hanya muncul setelah login owner.`;
  }

  if (!ownerVideoList) return;

  ownerVideoList.innerHTML = "";

  if (!data.videos || data.videos.length === 0) {
    renderOwnerVideoEmpty("Belum ada video yang bisa dibaca dari akun ini.");
    return;
  }

  data.videos.forEach((video) => {
    const card = document.createElement("article");
    card.className = `owner-video-card ${video.ownerStatusKey || "unknown"}`;

    const dateLabel = video.ownerStatusKey === "scheduled"
      ? `Jadwal publish: ${formatDateTime(video.publishAt)}`
      : `Upload: ${formatDateTime(video.publishedAt)}`;

    card.innerHTML = `
      <a href="${video.url}" target="_blank" rel="noreferrer" class="owner-video-thumb">
        <img src="${video.thumbnail || ""}" alt="">
        <span>${escapeHtml(video.durationText || "-")}</span>
      </a>

      <div class="owner-video-info">
        <div class="owner-video-topline">
          <span class="owner-video-status ${video.ownerStatusKey || "unknown"}">${escapeHtml(video.ownerStatusLabel || "Unknown")}</span>
          <small>${escapeHtml(dateLabel)}</small>
        </div>

        <h4>${escapeHtml(video.title || "Tanpa judul")}</h4>
        <p>${escapeHtml(video.ownerStatusText || "-")}</p>

        <div class="owner-video-metrics">
          <span>${formatNumber(video.viewCount)} views</span>
          <span>${formatNumber(video.likeCount)} likes</span>
          <span>${formatNumber(video.commentCount)} komentar</span>
          <span>${video.tags?.length || 0} tags</span>
        </div>
      </div>
    `;

    ownerVideoList.appendChild(card);
  });
}


function getOwnerTitleScore(title = "") {
  const text = String(title || "").trim();
  const lower = text.toLowerCase();
  let score = 35;

  if (text.length >= 35 && text.length <= 75) score += 20;
  else if (text.length >= 22 && text.length <= 95) score += 12;
  else score -= 8;

  if (/\d/.test(text)) score += 8;
  if (/[?!]/.test(text)) score += 5;
  if (/(cara|kenapa|rahasia|tips|kesalahan|terbaik|terbaru|viral|update|review|before|after|why|how|secret|mistake|best|worst|rare|hidden|stuck)/i.test(lower)) score += 13;
  if (/(part \d+|episode \d+|vlog|random|main-main|coba-coba)/i.test(lower)) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getOwnerVideoEngagement(video) {
  const views = Number(video?.viewCount || 0);
  const interactions = Number(video?.likeCount || 0) + Number(video?.commentCount || 0);
  return views > 0 ? (interactions / views) * 100 : 0;
}

function getFilteredOwnerVideos() {
  const videos = [...(lastOwnerVideosData?.videos || [])];
  const search = String(document.getElementById("ownerVideoSearch")?.value || "").trim().toLowerCase();
  const status = document.getElementById("ownerStatusFilter")?.value || "all";
  const sortMode = document.getElementById("ownerSortMode")?.value || "date-desc";

  let filtered = videos.filter((video) => {
    const haystack = `${video.title || ""} ${video.ownerStatusKey || ""} ${video.ownerStatusLabel || ""} ${(video.tags || []).join(" ")}`.toLowerCase();
    const statusOk = status === "all" || video.ownerStatusKey === status;
    const searchOk = !search || haystack.includes(search);
    return statusOk && searchOk;
  });

  filtered.sort((a, b) => {
    if (sortMode === "views-desc") return Number(b.viewCount || 0) - Number(a.viewCount || 0);
    if (sortMode === "engagement-desc") return getOwnerVideoEngagement(b) - getOwnerVideoEngagement(a);
    if (sortMode === "title-score-desc") return getOwnerTitleScore(b.title) - getOwnerTitleScore(a.title);

    const aDate = new Date(a.publishAt || a.publishedAt || 0).getTime();
    const bDate = new Date(b.publishAt || b.publishedAt || 0).getTime();
    return bDate - aDate;
  });

  return filtered;
}

function renderOwnerVideos(data) {
  ownerVideosPanel?.classList.remove("hidden");
  renderOwnerVideoStats(data.summary || {});

  const total = Number(data.summary?.total || 0);
  const scheduled = Number(data.summary?.scheduled || 0);
  const privateCount = Number(data.summary?.private || 0);
  const unlisted = Number(data.summary?.unlisted || 0);
  const filteredVideos = getFilteredOwnerVideos();

  if (ownerVideosSummary) {
    ownerVideosSummary.textContent =
      `Terbaca ${formatNumber(total)} video terbaru. Tampil ${formatNumber(filteredVideos.length)} sesuai filter. Scheduled: ${formatNumber(scheduled)} • Private/Unlisted: ${formatNumber(privateCount + unlisted)}.`;
  }

  if (!ownerVideoList) return;

  ownerVideoList.innerHTML = "";

  if (!filteredVideos.length) {
    renderOwnerVideoEmpty("Tidak ada video yang cocok dengan filter/search saat ini.");
    return;
  }

  filteredVideos.forEach((video) => {
    const card = document.createElement("article");
    card.className = `owner-video-card ${video.ownerStatusKey || "unknown"}`;

    const dateLabel = video.ownerStatusKey === "scheduled"
      ? `Jadwal publish: ${formatDateTime(video.publishAt)}`
      : `Upload: ${formatDateTime(video.publishedAt)}`;

    const titleScore = getOwnerTitleScore(video.title);
    const engagement = getOwnerVideoEngagement(video);

    card.innerHTML = `
      <a href="${video.url}" target="_blank" rel="noreferrer" class="owner-video-thumb">
        <img src="${video.thumbnail || ""}" alt="">
        <span>${escapeHtml(video.durationText || "-")}</span>
      </a>

      <div class="owner-video-info">
        <div class="owner-video-topline">
          <span class="owner-video-status ${video.ownerStatusKey || "unknown"}">${escapeHtml(video.ownerStatusLabel || "Unknown")}</span>
          <small>${escapeHtml(dateLabel)}</small>
        </div>

        <h4>${escapeHtml(video.title || "Tanpa judul")}</h4>
        <p>${escapeHtml(video.ownerStatusText || "-")}</p>

        <div class="owner-video-metrics">
          <span>${formatNumber(video.viewCount)} views</span>
          <span>${formatNumber(video.likeCount)} likes</span>
          <span>${formatNumber(video.commentCount)} komentar</span>
          <span>${formatPercent(engagement)} ER</span>
          <span>Title ${titleScore}/100</span>
        </div>
      </div>
    `;

    ownerVideoList.appendChild(card);
  });
}


function showOwnerGrowthState(state) {
  ownerGrowthPanel?.classList.remove("hidden");
  ownerGrowthLoading?.classList.add("hidden");
  ownerGrowthResult?.classList.add("hidden");
  ownerGrowthError?.classList.add("hidden");

  if (state === "loading") {
    ownerGrowthLoading?.classList.remove("hidden");
  }

  if (state === "result") {
    ownerGrowthResult?.classList.remove("hidden");
  }

  if (state === "error") {
    ownerGrowthError?.classList.remove("hidden");
  }
}

function setOwnerGrowthLoading(isLoading) {
  if (!analyzeOwnerGrowthBtn) return;

  analyzeOwnerGrowthBtn.disabled = isLoading;
  analyzeOwnerGrowthBtn.textContent = isLoading
    ? "Menganalisa..."
    : "Analisa Channel Stuck";
}

function renderOwnerGrowthList(container, items) {
  if (!container) return;

  container.innerHTML = "";

  if (!items || items.length === 0) {
    const div = document.createElement("div");
    div.className = "list-item";
    div.textContent = "Belum ada data.";
    container.appendChild(div);
    return;
  }

  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.textContent = `${index + 1}. ${item}`;
    container.appendChild(div);
  });
}

function renderScheduledReview(items) {
  if (!ownerScheduledReview) return;

  ownerScheduledReview.innerHTML = "";

  if (!items || items.length === 0) {
    ownerScheduledReview.innerHTML = `
      <div class="scheduled-review-empty">
        Belum ada video scheduled/private yang perlu direview.
      </div>
    `;
    return;
  }

  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "scheduled-review-card";

    div.innerHTML = `
      <strong>${escapeHtml(item.title || "Video scheduled")}</strong>
      <span>${escapeHtml(item.publishAt ? formatDateTime(item.publishAt) : item.status || "-")}</span>
      <p>${escapeHtml(item.advice || "Perkuat judul, thumbnail, dan deskripsi sebelum publish.")}</p>
    `;

    ownerScheduledReview.appendChild(div);
  });
}

function buildOwnerGrowthReport(data) {
  const metrics = data.metrics || {};
  const diagnosis = data.diagnosis || {};

  return `
CREATOR INSIGHT PRO V5.0 - OWNER GROWTH DIAGNOSIS

CHANNEL:
${lastOwnerVideosData?.channel?.title || "Channel YouTube"}

AI STATUS:
${data.aiStatus || "manual"}

SCORE:
Overall Growth Score: ${metrics.overallScore || 0}/100
Growth: ${metrics.growthScore || 0}/100
Engagement: ${metrics.engagementScore || 0}/100
Consistency: ${metrics.consistencyScore || 0}/100
Title Quality: ${metrics.titleQualityScore || 0}/100

DIAGNOSIS:
${diagnosis.title || "-"}
${diagnosis.text || "-"}

MASALAH UTAMA:
${(data.causes || []).map((x, i) => `${i + 1}. ${x}`).join("\n")}

REKOMENDASI:
${(data.recommendations || []).map((x, i) => `${i + 1}. ${x}`).join("\n")}

ACTION PLAN:
${(data.actionPlan || []).map((x, i) => `${i + 1}. ${x}`).join("\n")}

IDE KONTEN:
${(data.contentIdeas || []).map((x, i) => `${i + 1}. ${x}`).join("\n")}

SCHEDULE ADVICE:
${data.scheduleAdvice || "-"}
  `.trim();
}

function renderOwnerGrowthDiagnosis(data) {
  const metrics = data.metrics || {};
  const diagnosis = data.diagnosis || {};
  const bestVideo = data.bestVideo || {};

  if (ownerGrowthAiStatus) {
    ownerGrowthAiStatus.classList.remove("gemini", "manual");
    ownerGrowthAiStatus.textContent = data.aiStatus === "gemini"
      ? "AI Gemini Active"
      : "Manual Smart Diagnosis";
    ownerGrowthAiStatus.classList.add(data.aiStatus === "gemini" ? "gemini" : "manual");
  }

  if (ownerGrowthTitle) ownerGrowthTitle.textContent = diagnosis.title || "Diagnosis Channel";
  if (ownerGrowthText) ownerGrowthText.textContent = diagnosis.text || "Belum ada diagnosis.";
  if (ownerGrowthScore) ownerGrowthScore.textContent = `${metrics.overallScore || 0}/100`;
  if (ownerGrowthTrend) ownerGrowthTrend.textContent = `${metrics.growthPercentage || 0}%`;
  if (ownerGrowthEngagement) ownerGrowthEngagement.textContent = formatPercent(metrics.engagementRate || 0);
  if (ownerGrowthConsistency) ownerGrowthConsistency.textContent = `${metrics.avgUploadGapDays || 0} hari`;
  if (ownerGrowthBestVideo) ownerGrowthBestVideo.textContent = bestVideo.title || "-";

  renderOwnerGrowthList(ownerGrowthCauses, data.causes || []);
  renderOwnerGrowthList(ownerGrowthRecommendations, data.recommendations || []);
  renderOwnerGrowthList(ownerGrowthActionPlan, data.actionPlan || []);
  renderOwnerGrowthList(ownerGrowthIdeas, data.contentIdeas || []);

  if (ownerScheduleAdvice) {
    ownerScheduleAdvice.textContent = data.scheduleAdvice || "Belum ada saran schedule.";
  }

  renderScheduledReview(data.scheduledReview || []);

  lastOwnerGrowthData = data;
  lastOwnerGrowthReport = buildOwnerGrowthReport(data);
  renderOwnerV5Dashboard(data);
  showOwnerGrowthState("result");
}

function renderV5List(id, items) {
  const box = document.getElementById(id);
  if (!box) return;
  box.innerHTML = "";
  const values = Array.isArray(items) ? items : [];

  if (!values.length) {
    box.innerHTML = `<div class="list-item">Belum ada data.</div>`;
    return;
  }

  values.slice(0, 12).forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "list-item";
    const text = typeof item === "string"
      ? item
      : `${item.task || item.title || item.day || "Item"}${item.goal ? ` — ${item.goal}` : ""}`;
    div.textContent = `${index + 1}. ${text}`;
    box.appendChild(div);
  });
}

function renderV5Calendar(items) {
  const box = document.getElementById("v5ContentCalendar");
  if (!box) return;
  box.innerHTML = "";

  const calendar = Array.isArray(items) ? items : [];
  if (!calendar.length) {
    box.innerHTML = `<div class="v5-calendar-empty">Belum ada kalender konten.</div>`;
    return;
  }

  calendar.slice(0, 14).forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "v5-calendar-card";
    card.innerHTML = `
      <span>${escapeHtml(item.day || `Hari ${index + 1}`)}</span>
      <strong>${escapeHtml(item.title || "Ide konten")}</strong>
      <small>${escapeHtml(item.type || "Content")} • ${escapeHtml(item.goal || "validasi")}</small>
    `;
    box.appendChild(card);
  });
}

function buildOwnerV5Report(data) {
  const metrics = data.metrics || {};
  const diagnosis = data.diagnosis || {};
  const lines = [];

  lines.push("CREATOR INSIGHT PRO V5.0 - OWNER DASHBOARD");
  lines.push("");
  lines.push(`Channel: ${lastOwnerVideosData?.channel?.title || "Channel YouTube"}`);
  lines.push(`AI Status: ${data.aiStatus || "manual"}`);
  lines.push(`Overall Score: ${metrics.overallScore || 0}/100`);
  lines.push(`Growth Trend: ${metrics.growthPercentage || 0}%`);
  lines.push(`Engagement Rate: ${formatPercent(metrics.engagementRate || 0)}`);
  lines.push(`Pipeline Score: ${data.pipelineScore || 0}/100`);
  lines.push("");
  lines.push("RINGKASAN:");
  lines.push(diagnosis.title || "-");
  lines.push(diagnosis.text || "-");
  lines.push("");

  const sections = [
    ["MASALAH UTAMA", data.causes],
    ["REKOMENDASI", data.recommendations],
    ["PRIORITY MATRIX", data.priorityMatrix],
    ["UPLOAD STRATEGY", data.uploadStrategy],
    ["TITLE BANK", data.titleBank],
    ["THUMBNAIL BRIEF", data.thumbnailBriefs],
    ["REPURPOSE PLAN", data.repurposePlan],
    ["RISK NOTES", data.riskNotes],
  ];

  sections.forEach(([title, items]) => {
    lines.push(title + ":");
    (items || []).forEach((item, index) => lines.push(`${index + 1}. ${item}`));
    lines.push("");
  });

  lines.push("CONTENT CALENDAR 14 HARI:");
  (data.contentCalendar || []).forEach((item, index) => {
    lines.push(`${index + 1}. ${item.day || `Hari ${index + 1}`} - ${item.type || "Content"} - ${item.title || "Ide konten"} - ${item.goal || "validasi"}`);
  });

  return lines.join("\n").trim();
}

function renderOwnerV5Dashboard(data) {
  if (!data) return;
  const panel = document.getElementById("ownerProV5Panel");
  panel?.classList.remove("hidden");

  const metrics = data.metrics || {};
  const diagnosis = data.diagnosis || {};
  const pipelineScore = data.pipelineScore || metrics.scheduleScore || 0;

  setText("v5OverallScore", `${metrics.overallScore || 0}/100`);
  setText("v5OverallNote", data.aiStatus === "gemini" ? "AI active" : "manual fallback");
  setText("v5GrowthTrend", `${metrics.growthPercentage || 0}%`);
  setText("v5EngagementRate", formatPercent(metrics.engagementRate || 0));
  setText("v5PipelineScore", `${pipelineScore}/100`);

  const summary = `${diagnosis.title || "Diagnosis Channel"}. ${diagnosis.text || ""}`.trim();
  setText("v5ExecutiveSummary", summary || "Belum ada ringkasan.");

  renderV5List("v5PriorityMatrix", data.priorityMatrix || data.recommendations || []);
  renderV5List("v5UploadStrategy", data.uploadStrategy || data.actionPlan || []);
  renderV5List("v5TitleBank", data.titleBank || data.contentIdeas || []);
  renderV5List("v5ThumbnailBriefs", data.thumbnailBriefs || []);
  renderV5Calendar(data.contentCalendar || []);
  renderV5List("v5RepurposePlan", data.repurposePlan || []);
  renderV5List("v5RiskNotes", data.riskNotes || []);

  lastOwnerV5Report = buildOwnerV5Report(data);
}

async function generateOwnerV5Dashboard() {
  if (!lastOwnerVideosData || !lastOwnerVideosData.videos?.length) {
    renderOwnerVideoEmpty("Baca video channel dulu, baru generate Dashboard V5.");
    return;
  }

  if (lastOwnerGrowthData) {
    renderOwnerV5Dashboard(lastOwnerGrowthData);
    document.getElementById("ownerProV5Panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  await analyzeOwnerGrowth();
  setTimeout(() => {
    document.getElementById("ownerProV5Panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 300);
}

async function copyOwnerV5Report() {
  if (!lastOwnerV5Report) {
    alert("Belum ada V5 report. Klik Generate Dashboard V5 dulu.");
    return;
  }

  try {
    await navigator.clipboard.writeText(lastOwnerV5Report);
    const btn = document.getElementById("copyOwnerV5ReportBtn");
    if (btn) {
      btn.textContent = "V5 Report Dicopy";
      setTimeout(() => (btn.textContent = "Copy V5 Report"), 1500);
    }
  } catch {
    const temp = document.createElement("textarea");
    temp.value = lastOwnerV5Report;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }
}

function downloadOwnerV5Report() {
  if (!lastOwnerV5Report) {
    alert("Belum ada V5 report. Klik Generate Dashboard V5 dulu.");
    return;
  }

  const blob = new Blob([lastOwnerV5Report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `creator-insight-v5-report-${date}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}


async function analyzeOwnerGrowth() {
  if (!lastOwnerVideosData || !lastOwnerVideosData.videos) {
    renderOwnerVideoEmpty("Baca daftar video channel terlebih dahulu, lalu klik Analisa Channel Stuck.");
    return;
  }

  showOwnerGrowthState("loading");
  setOwnerGrowthLoading(true);

  try {
    const response = await fetch("/api/youtube/oauth/diagnosis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: lastOwnerVideosData.channel,
        summary: lastOwnerVideosData.summary,
        videos: lastOwnerVideosData.videos,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gagal membuat diagnosis channel.");
    }

    renderOwnerGrowthDiagnosis(data);
  } catch (error) {
    if (ownerGrowthErrorMessage) {
      ownerGrowthErrorMessage.textContent = error.message || "Gagal membuat diagnosis channel.";
    }

    showOwnerGrowthState("error");
  } finally {
    setOwnerGrowthLoading(false);
  }
}

async function loadOwnerVideos() {
  ownerVideosPanel?.classList.remove("hidden");
  ownerGrowthPanel?.classList.add("hidden");
  document.getElementById("ownerProV5Panel")?.classList.add("hidden");
  lastOwnerGrowthReport = "";
  lastOwnerGrowthData = null;
  lastOwnerV5Report = "";
  renderOwnerVideoEmpty("Sedang membaca daftar video channel...");
  setOwnerVideoLoading(true);

  try {
    const response = await fetch("/api/youtube/oauth/videos?limit=50", {
      method: "GET",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gagal membaca daftar video channel.");
    }

    lastOwnerVideosData = data;
    renderOwnerVideos(data);
  } catch (error) {
    lastOwnerVideosData = null;
    renderOwnerVideoStats({ total: 0, published: 0, scheduled: 0, private: 0, unlisted: 0 });
    renderOwnerVideoEmpty(error.message || "Gagal membaca daftar video channel.");
  } finally {
    setOwnerVideoLoading(false);
  }
}

async function checkYoutubeLoginStatus() {
  try {
    setYoutubeLoginState(
      null,
      "Mengecek Login YouTube...",
      "Sedang membaca status akun YouTube."
    );

    const response = await fetch("/api/youtube/oauth/me", {
      method: "GET",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gagal mengecek status login YouTube.");
    }

    if (!data.loggedIn) {
      ownerChannelCard?.classList.add("hidden");

      setYoutubeLoginState(
        "error",
        "Belum Login YouTube",
        data.message || "Klik Login YouTube untuk masuk ke owner mode."
      );

      return;
    }

    setYoutubeLoginState(
      "success",
      "YouTube Owner Mode Aktif",
      "Login berhasil. Tool sudah bisa membaca channel milik akun YouTube ini."
    );

    renderOwnerChannel(data.channel);
  } catch (error) {
    ownerChannelCard?.classList.add("hidden");

    setYoutubeLoginState(
      "error",
      "Gagal Mengecek Login",
      error.message || "Terjadi kesalahan saat mengecek login YouTube."
    );
  }
}

checkYoutubeLoginBtn?.addEventListener("click", () => {
  checkYoutubeLoginStatus();
});

loadOwnerVideosBtn?.addEventListener("click", () => {
  loadOwnerVideos();
});

refreshOwnerVideosBtn?.addEventListener("click", () => {
  loadOwnerVideos();
});

analyzeOwnerGrowthBtn?.addEventListener("click", () => {
  analyzeOwnerGrowth();
});

copyOwnerGrowthReportBtn?.addEventListener("click", async () => {
  if (!lastOwnerGrowthReport) {
    alert("Belum ada diagnosis untuk dicopy.");
    return;
  }

  try {
    await navigator.clipboard.writeText(lastOwnerGrowthReport);
    copyOwnerGrowthReportBtn.textContent = "Diagnosis Dicopy";

    setTimeout(() => {
      copyOwnerGrowthReportBtn.textContent = "Copy Diagnosis";
    }, 1500);
  } catch {
    const temp = document.createElement("textarea");
    temp.value = lastOwnerGrowthReport;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }
});


document.getElementById("ownerVideoSearch")?.addEventListener("input", () => {
  if (lastOwnerVideosData) renderOwnerVideos(lastOwnerVideosData);
});

document.getElementById("ownerStatusFilter")?.addEventListener("change", () => {
  if (lastOwnerVideosData) renderOwnerVideos(lastOwnerVideosData);
});

document.getElementById("ownerSortMode")?.addEventListener("change", () => {
  if (lastOwnerVideosData) renderOwnerVideos(lastOwnerVideosData);
});

document.getElementById("generateOwnerV5Btn")?.addEventListener("click", () => {
  generateOwnerV5Dashboard();
});

document.getElementById("copyOwnerV5ReportBtn")?.addEventListener("click", () => {
  copyOwnerV5Report();
});

document.getElementById("downloadOwnerV5ReportBtn")?.addEventListener("click", () => {
  downloadOwnerV5Report();
});

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const youtubeLogin = params.get("youtubeLogin");
  const message = params.get("message");

  if (youtubeLogin === "success") {
    checkYoutubeLoginStatus();

    window.history.replaceState(
      {},
      document.title,
      `${window.location.pathname}#videoBoosterSection`
    );
  }

  if (youtubeLogin === "error") {
    setYoutubeLoginState(
      "error",
      "Login YouTube Gagal",
      message || "OAuth YouTube gagal."
    );

    window.history.replaceState(
      {},
      document.title,
      `${window.location.pathname}#videoBoosterSection`
    );
  }
});
setupTabs();
