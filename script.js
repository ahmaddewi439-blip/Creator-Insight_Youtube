// ----------------------
// Tab switching
// ----------------------
const tabs = document.querySelectorAll('.sidebar .menu li');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(tab.getAttribute('data-tab')).classList.add('active');

    // Load data per tab if needed
    if(tab.dataset.tab === 'video-audit') loadVideoAudit();
    if(tab.dataset.tab === 'overview') loadChannelOverview().then(loadAiSection);
  });
});

// ----------------------
// YouTube API config
// ----------------------
const API_KEY = 'YOUR_YOUTUBE_API_KEY';
const CHANNEL_ID = 'YOUR_CHANNEL_ID';

// Fetch channel info
async function fetchChannelData() {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${CHANNEL_ID}&key=${API_KEY}`);
  const data = await res.json();
  return data.items[0];
}

// Fetch latest videos
async function fetchVideos(maxResults = 20) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&maxResults=${maxResults}&key=${API_KEY}`);
  const data = await res.json();
  return data.items;
}

// Fetch video stats
async function fetchVideoStats(videoIds) {
  if(videoIds.length === 0) return [];
  const ids = videoIds.join(',');
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids}&key=${API_KEY}`);
  const data = await res.json();
  return data.items;
}

// ----------------------
// Load Overview tab
// ----------------------
async function loadChannelOverview() {
  const channel = await fetchChannelData();
  document.querySelector('.channel-summary .info h3').textContent = channel.snippet.title;
  document.querySelector('.channel-summary .info p').textContent =
    `Subscribers: ${channel.statistics.subscriberCount} | Views: ${channel.statistics.viewCount} | Videos: ${channel.statistics.videoCount}`;

  const videos = await fetchVideos();
  const videoIds = videos.map(v => v.id.videoId).filter(Boolean);
  const stats = await fetchVideoStats(videoIds);

  // Generate mini chart for last 7 videos views
  const labels = stats.map(v => v.snippet.title.slice(0,15));
  const views = stats.map(v => parseInt(v.statistics.viewCount));

  const ctx = document.querySelector('.chart-placeholder').getContext('2d');
  if(window.overviewChart) window.overviewChart.destroy();
  window.overviewChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets:[{ label:'Views', data:views, backgroundColor:'#0af' }] },
    options:{ responsive:true, plugins:{ legend:{display:false}, tooltip:{mode:'index'} }, scales:{ y:{beginAtZero:true} } }
  });

  // Top videos
  const topList = document.querySelector('.top-videos ul');
  topList.innerHTML = stats.slice(0,5).map(v=>`<li>${v.snippet.title} - ${calculateScore(v)}</li>`).join('');
}

// ----------------------
// Load Video Audit tab
// ----------------------
async function loadVideoAudit() {
  const videos = await fetchVideos(20);
  const videoIds = videos.map(v => v.id.videoId).filter(Boolean);
  const stats = await fetchVideoStats(videoIds);

  const tableContainer = document.querySelector('.audit-table');
  tableContainer.innerHTML = '';
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr><th>Thumbnail</th><th>Title</th><th>Upload Date</th><th>Views</th><th>Score</th></tr>
    </thead>
    <tbody>
      ${stats.map(v => `
        <tr>
          <td><img src="${v.snippet.thumbnails.default.url}"></td>
          <td>${v.snippet.title}</td>
          <td>${new Date(v.snippet.publishedAt).toLocaleDateString()}</td>
          <td>${v.statistics.viewCount}</td>
          <td>${calculateScore(v)}</td>
        </tr>`).join('')}
    </tbody>
  `;
  tableContainer.appendChild(table);
}

// ----------------------
// Simple score logic
// ----------------------
function calculateScore(video) {
  const views = parseInt(video.statistics.viewCount);
  if(views>1000000) return 'Winner';
  if(views>100000) return 'Normal';
  return 'Weak';
}

// ----------------------
// Gemini AI integration
// ----------------------
const AI_BASE_URL = 'https://lite.koboillm.com/v1';
const AI_MODEL = 'gemini/gemini-2.5-flash-lite';
const AI_API_KEY = 'YOUR_OPENAI_COMPATIBLE_SK_KEY'; // gunakan serverless function jika bisa

async function generateAiReport(channelData, videoStats) {
  const prompt = `
    Berikut adalah data channel YouTube:
    Channel Name: ${channelData.snippet.title}
    Subscribers: ${channelData.statistics.subscriberCount}
    Total Views: ${channelData.statistics.viewCount}
    Total Videos: ${channelData.statistics.videoCount}

    Video terakhir:
    ${videoStats.map(v => `- ${v.snippet.title}, views: ${v.statistics.viewCount}`).join('\n')}

    Tolong buatkan:
    1. Diagnosis channel
    2. Rekomendasi SEO / Keyword
    3. Action Plan 7 hari
    4. Ide konten berikutnya
    5. Competitor insights singkat
    Jawab secara ringkas tapi profesional, gunakan bahasa Indonesia.
  `;

  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000
      })
    });
    const data = await res.json();
    return data.choices[0].message.content;
  } catch (err) {
    console.error('AI report error:', err);
    return 'AI report gagal di-generate, gunakan data manual.';
  }
}

// ----------------------
// Load AI panel in Overview
// ----------------------
async function loadAiSection() {
  const channel = await fetchChannelData();
  const videos = await fetchVideos();
  const videoIds = videos.map(v => v.id.videoId).filter(Boolean);
  const stats = await fetchVideoStats(videoIds);

  const aiReport = await generateAiReport(channel, stats);

  const overviewSection = document.getElementById('overview');
  let aiPanel = document.querySelector('.ai-report');
  if(!aiPanel){
    aiPanel = document.createElement('div');
    aiPanel.classList.add('ai-report');
    overviewSection.appendChild(aiPanel);
  }
  aiPanel.innerHTML = `<h3>AI Report</h3><pre>${aiReport}</pre>`;
}

// ----------------------
// Initial load
// ----------------------
loadChannelOverview().then(loadAiSection);
