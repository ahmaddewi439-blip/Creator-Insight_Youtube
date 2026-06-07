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

let lastResultText = "";

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

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setImage(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src || "";
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
      document.getElementById(button.dataset.tab).classList.add("active");
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

function renderCompetitors(competitors) {
  const box = document.getElementById("competitorPanel");
  box.innerHTML = "";

  if (!competitors || competitors.length === 0) {
    box.innerHTML = `
      <div class="panel-card full">
        <h3>Belum ada kompetitor</h3>
        <p>Masukkan 1-3 channel kompetitor di form awal untuk menampilkan perbandingan.</p>
      </div>
    `;
    return;
  }

  competitors.forEach((comp) => {
    const card = document.createElement("div");
    card.className = "competitor-card";

    card.innerHTML = `
      <h4>${escapeHtml(comp.channel.title)}</h4>
      <p>${escapeHtml(comp.channel.handle || comp.channel.id || "")}</p>

      <div class="comp-stats">
        <div>
          <span>Subscriber</span>
          <strong>${comp.channel.hiddenSubscriberCount ? "Hidden" : formatNumber(comp.channel.subscriberCount)}</strong>
        </div>
        <div>
          <span>Avg Views</span>
          <strong>${formatNumber(comp.summary.averageViews)}</strong>
        </div>
        <div>
          <span>Health</span>
          <strong>${comp.summary.healthScore}/100</strong>
        </div>
      </div>

      <p><strong>Top Video:</strong> ${escapeHtml(comp.topVideo?.title || "-")}</p>
      <p>${escapeHtml(comp.gapInsight || "-")}</p>
    `;

    box.appendChild(card);
  });
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildReport(data) {
  return `
CREATOR INSIGHT PRO V2 REPORT

CHANNEL:
${data.channel.title}
${data.channel.handle || data.channel.id}

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
${data.recommendations.map((x, i) => `${i + 1}. ${x}`).join("\n")}

ACTION PLAN:
${data.actionPlan.map((x, i) => `${i + 1}. ${x}`).join("\n")}

CONTENT IDEAS:
${data.ideas.map((x, i) => `${i + 1}. ${x}`).join("\n")}
  `.trim();
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

  renderCompetitors(data.competitors);

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

setupTabs();
