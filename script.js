// ---- Tab switching (tetap ada) ----
const tabs = document.querySelectorAll('.sidebar .menu li');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));

    tab.classList.add('active');
    const tabId = tab.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');

    // Optional: load dynamic data when tab active
    if(tabId === 'video-audit') loadVideoAudit();
    if(tabId === 'overview') loadChannelOverview();
  });
});

// ---- YouTube API Integration ----
const API_KEY = 'YOUR_YOUTUBE_API_KEY';
const CHANNEL_ID = 'YOUR_CHANNEL_ID';

// Fetch channel info
async function fetchChannelData() {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${CHANNEL_ID}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items[0];
}

// Fetch videos list
async function fetchVideos() {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&maxResults=20&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items;
}

// Fetch video stats
async function fetchVideoStats(videoIds) {
  const ids = videoIds.join(',');
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items;
}

// ---- Dynamic Overview ----
async function loadChannelOverview() {
  const channel = await fetchChannelData();

  document.querySelector('.channel-summary .info h3').textContent = channel.snippet.title;
  document.querySelector('.channel-summary .info p').textContent = `Subscribers: ${channel.statistics.subscriberCount} | Views: ${channel.statistics.viewCount} | Videos: ${channel.statistics.videoCount}`;

  const videos = await fetchVideos();
  const videoIds = videos.map(v => v.id.videoId);
  const stats = await fetchVideoStats(videoIds);

  // Generate mini chart for last 7 videos views
  const labels = stats.map(v => v.snippet.title.slice(0,15));
  const views = stats.map(v => parseInt(v.statistics.viewCount));

  const ctx = document.querySelector('.chart-placeholder').getContext('2d');
  if(window.overviewChart) window.overviewChart.destroy();

  window.overviewChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Views',
        data: views,
        backgroundColor: '#0af'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ---- Dynamic Video Audit Table ----
async function loadVideoAudit() {
  const videos = await fetchVideos();
  const videoIds = videos.map(v => v.id.videoId);
  const stats = await fetchVideoStats(videoIds);

  const tableContainer = document.querySelector('.audit-table');
  tableContainer.innerHTML = '';

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Thumbnail</th>
        <th>Title</th>
        <th>Upload Date</th>
        <th>Views</th>
        <th>Score</th>
      </tr>
    </thead>
    <tbody>
      ${stats.map(v => `
        <tr>
          <td><img src="${v.snippet.thumbnails.default.url}" alt="thumb"></td>
          <td>${v.snippet.title}</td>
          <td>${new Date(v.snippet.publishedAt).toLocaleDateString()}</td>
          <td>${v.statistics.viewCount}</td>
          <td>${calculateScore(v)}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  tableContainer.appendChild(table);
}

// ---- Simple score logic placeholder ----
function calculateScore(video) {
  const views = parseInt(video.statistics.viewCount);
  if(views > 1000000) return 'Winner';
  if(views > 100000) return 'Normal';
  return 'Weak';
}

// ---- Initial load ----
loadChannelOverview();
