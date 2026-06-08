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

  // Chart
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
// Score
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
const AI_BASE_URL = process.env.AI_BASE_URL || '/api/analyze';
async function loadAiSection() {
  const channel = await fetchChannelData();
  const videos = await fetchVideos();
  const videoIds = videos.map(v => v.id.videoId).filter(Boolean);
  const stats = await fetchVideoStats(videoIds);

  try {
    const res = await fetch(AI_BASE_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ channelData: channel, videoStats: stats })
    });
    const data = await res.json();
    const aiPanel = document.querySelector('.ai-report');
    aiPanel.innerHTML = `<h3>AI Report</h3><pre>${data.aiText}</pre>`;
  } catch(err){console.error('Frontend AI error:',err);}
}

// ----------------------
// Buttons Interactivity
// ----------------------

// AI Badge click
document.querySelector('.ai-status').addEventListener('click', ()=>{
  alert('AI Gemini Active - AI siap menganalisis channel');
});

// Mode toggle click
document.querySelector('.mode-status').addEventListener('click', ()=>{
  const badge = document.querySelector('.mode-status');
  const modes = ['Lite','Pro','Max'];
  const current = badge.textContent.split(': ')[1];
  const nextIndex = (modes.indexOf(current)+1)%modes.length;
  badge.textContent = `Mode: ${modes[nextIndex]}`;
  alert(`Mode sekarang: ${modes[nextIndex]}`);
});

// Copy Report button (example)
function copyReport(){
  const aiPanel = document.querySelector('.ai-report');
  if(!aiPanel) return;
  const text = aiPanel.innerText;
  navigator.clipboard.writeText(text).then(()=>alert('Report copied to clipboard'));
}

// Download PDF / print preview (example)
function downloadPDF(){
  window.print();
}

// ----------------------
// Initial load
// ----------------------
loadChannelOverview().then(loadAiSection);
