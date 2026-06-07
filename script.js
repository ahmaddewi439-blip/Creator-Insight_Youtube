const form = document.getElementById("analyzeForm");
const inputSection = document.getElementById("inputSection");
const loadingSection = document.getElementById("loadingSection");
const resultSection = document.getElementById("resultSection");
const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");

const loadingText = document.getElementById("loadingText");
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const step4 = document.getElementById("step4");

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

function formatNumber(num) {
  const n = Number(num || 0);

  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";

  return n.toLocaleString("id-ID");
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
  });
}

function startLoadingAnimation() {
  const steps = [
    {
      text: "Membaca profil channel YouTube...",
      active: step1,
    },
    {
      text: "Mengambil video terbaru dari channel...",
      active: step2,
    },
    {
      text: "Menghitung performa view, like, dan komentar...",
      active: step3,
    },
    {
      text: "Menyusun diagnosis dan rekomendasi strategi...",
      active: step4,
    },
  ];

  step1.classList.remove("active");
  step2.classList.remove("active");
  step3.classList.remove("active");
  step4.classList.remove("active");

  let index = 0;
  loadingText.textContent = steps[0].text;
  steps[0].active.classList.add("active");

  return setInterval(() => {
    index = (index + 1) % steps.length;
    loadingText.textContent = steps[index].text;
    steps[index].active.classList.add("active");
  }, 900);
}

function buildChart(videos) {
  const chart = document.getElementById("miniChart");
  chart.innerHTML = "";

  if (!videos || videos.length === 0) {
    chart.innerHTML = `<div class="empty-chart">Belum ada data video.</div>`;
    return;
  }

  const orderedVideos = [...videos].reverse();
  const maxViews = Math.max(...orderedVideos.map((v) => Number(v.viewCount || 0)), 1);

  orderedVideos.forEach((video) => {
    const height = Math.max((Number(video.viewCount || 0) / maxViews) * 100, 8);

    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = `${height}%`;
    bar.title = `${video.title} - ${formatNumber(video.viewCount)} views`;

    chart.appendChild(bar);
  });
}

function fillVideoCard(prefix, video) {
  const thumb = document.getElementById(`${prefix}VideoThumb`);
  const title = document.getElementById(`${prefix}VideoTitle`);
  const stats = document.getElementById(`${prefix}VideoStats`);

  if (!video) {
    title.textContent = "-";
    stats.textContent = "-";
    thumb.removeAttribute("src");
    return;
  }

  thumb.src = video.thumbnail || "";
  title.textContent = video.title || "-";
  stats.textContent = `${formatNumber(video.viewCount)} views • ${formatNumber(video.likeCount)} likes • ${formatNumber(video.commentCount)} komentar`;
}

function renderList(containerId, items, className) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (!items || items.length === 0) {
    const div = document.createElement("div");
    div.className = className;
    div.textContent = "Belum ada rekomendasi.";
    container.appendChild(div);
    return;
  }

  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = className;
    div.textContent = `${index + 1}. ${item}`;
    container.appendChild(div);
  });
}

function renderResult(data) {
  const channel = data.channel;
  const summary = data.summary;
  const diagnosis = data.diagnosis;
  const videos = data.videos;

  document.getElementById("channelAvatar").src = channel.avatar || "";
  document.getElementById("channelTitle").textContent = channel.title || "Channel YouTube";
  document.getElementById("channelHandle").textContent = channel.handle || channel.id || "-";
  document.getElementById("channelPublished").textContent = `Bergabung ${formatDate(channel.publishedAt)}`;

  document.getElementById("subscriberCount").textContent = channel.hiddenSubscriberCount
    ? "Hidden"
    : formatNumber(channel.subscriberCount);

  document.getElementById("viewCount").textContent = formatNumber(channel.viewCount);
  document.getElementById("videoCount").textContent = formatNumber(channel.videoCount);
  document.getElementById("healthScore").textContent = `${summary.healthScore}/100`;

  document.getElementById("diagnosisTitle").textContent = diagnosis.title;
  document.getElementById("diagnosisText").textContent = diagnosis.text;

  document.getElementById("avgViewsText").textContent =
    `Rata-rata view ${summary.analyzedVideos} video terakhir: ${formatNumber(summary.averageViews)}`;

  document.getElementById("growthStatus").textContent = summary.growthStatus;

  fillVideoCard("best", videos.best);
  fillVideoCard("weak", videos.weakest);

  buildChart(videos.items);

  renderList("recommendationList", data.recommendations, "recommendation-item");
  renderList("contentIdeas", data.ideas, "idea-item");

  lastResultText = `
CREATOR INSIGHT YOUTUBE

Channel: ${channel.title}
Subscriber: ${channel.hiddenSubscriberCount ? "Hidden" : formatNumber(channel.subscriberCount)}
Total Views: ${formatNumber(channel.viewCount)}
Total Video: ${formatNumber(channel.videoCount)}

Skor Channel: ${summary.healthScore}/100
Status Growth: ${summary.growthStatus}
Rata-rata View: ${formatNumber(summary.averageViews)}

Diagnosis:
${diagnosis.title}
${diagnosis.text}

Video Terbaik:
${videos.best ? videos.best.title : "-"} 
${videos.best ? formatNumber(videos.best.viewCount) + " views" : ""}

Video Terlemah:
${videos.weakest ? videos.weakest.title : "-"} 
${videos.weakest ? formatNumber(videos.weakest.viewCount) + " views" : ""}

Rekomendasi:
${data.recommendations.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Ide Konten:
${data.ideas.map((item, i) => `${i + 1}. ${item}`).join("\n")}
  `.trim();

  copyArea.value = lastResultText;
  show(resultSection);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const channelInput = document.getElementById("channelInput").value.trim();
  const videoLimit = document.querySelector("input[name='videoLimit']:checked").value;

  if (!channelInput) {
    errorMessage.textContent = "Masukkan link channel, handle, atau Channel ID terlebih dahulu.";
    show(errorBox);
    return;
  }

  show(loadingSection);
  const loadingInterval = startLoadingAnimation();

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelInput,
        videoLimit: Number(videoLimit),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gagal menganalisa channel.");
    }

    clearInterval(loadingInterval);
    renderResult(data);
  } catch (error) {
    clearInterval(loadingInterval);
    errorMessage.textContent = error.message || "Terjadi kesalahan saat membaca channel.";
    show(errorBox);
  }
});

backBtn.addEventListener("click", () => {
  show(inputSection);
});

backFromError.addEventListener("click", () => {
  show(inputSection);
});

copyResultBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(lastResultText);
    copyResultBtn.textContent = "Berhasil Dicopy";
    setTimeout(() => {
      copyResultBtn.textContent = "Copy Hasil Analisa";
    }, 1600);
  } catch {
    copyArea.classList.remove("hidden");
    copyArea.select();
    document.execCommand("copy");
    copyArea.classList.add("hidden");
  }
});
