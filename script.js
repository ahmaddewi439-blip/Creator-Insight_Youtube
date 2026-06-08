// --------------------------
// Global Variables
// --------------------------
let lastAnalysisData = null;
let lastResultText = '';
const tabs = document.querySelectorAll('.sidebar nav ul li');
const tabPanels = document.querySelectorAll('.tab-panel');
const analyzeBtn = document.getElementById('analyzeBtn');
const channelInput = document.getElementById('channelInput');
const competitorInput = document.getElementById('competitorInput');
const addCompetitorBtn = document.getElementById('addCompetitorBtn');
const competitorCards = document.getElementById('competitorCards');
const keywordPanel = document.getElementById('keywordPanel');
const copyBtn = document.getElementById('copyReportBtn');
const downloadBtn = document.getElementById('downloadPDFBtn');
const modeStatusBadge = document.getElementById('modeStatusBadge');
const aiStatusBadge = document.getElementById('aiStatusBadge');
const videoAuditTableBody = document.querySelector('#videoAuditTable tbody');
const performanceTrendCanvas = document.getElementById('performanceTrend').getContext('2d');

// --------------------------
// Tab Switching
// --------------------------
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        tabPanels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
    });
});

// --------------------------
// YouTube API Analysis
// --------------------------
async function analyzeChannel() {
    const channel = channelInput.value.trim();
    if (!channel) return alert('Please enter a YouTube channel URL, handle, or ID.');

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel })
        });
        const data = await response.json();
        lastAnalysisData = data;
        lastResultText = buildReport(data);
        renderOverview(data);
        renderVideoAudit(data);
        renderKeywordPanel(data);
        renderCompetitorCards(data);
        updateModeBadge(data.mode);
        updateAiBadge(data.aiStatus);
    } catch (err) {
        console.error(err);
        alert('Error analyzing channel. See console.');
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Channel';
    }
}

// --------------------------
// Build AI / Manual Report Text
// --------------------------
function buildReport(data) {
    let report = `Channel: ${data.channelName}\n`;
    report += `AI Status: ${data.aiStatus}\n`;
    report += `Subscribers: ${data.subscribers}\n`;
    report += `Total Views: ${data.totalViews}\n`;
    report += `Total Videos: ${data.totalVideos}\n`;
    report += `Health Score: ${data.healthScore}\n\n`;
    report += `Video Audit:\n`;
    data.videoAudit.forEach(v => {
        report += `${v.title} - Views: ${v.views} - Status: ${v.status}\n`;
    });
    report += `\nKeywords: ${data.keywords.join(', ')}\n`;
    report += `\nAction Plan:\n${data.actionPlan}\n`;
    return report;
}

// --------------------------
// Render Functions
// --------------------------
function renderOverview(data) {
    document.getElementById('subCount').textContent = data.subscribers;
    document.getElementById('viewCount').textContent = data.totalViews;
    document.getElementById('videoCount').textContent = data.totalVideos;
    document.getElementById('healthScore').textContent = data.healthScore;

    if (window.performanceChart) window.performanceChart.destroy();
    window.performanceChart = new Chart(performanceTrendCanvas, {
        type: 'line',
        data: {
            labels: data.trend.labels,
            datasets: [{
                label: 'Views Trend',
                data: data.trend.views,
                borderColor: '#00ff99',
                backgroundColor: 'rgba(0,255,153,0.2)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

function renderVideoAudit(data) {
    videoAuditTableBody.innerHTML = '';
    data.videoAudit.forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${v.title}</td>
            <td>${v.views}</td>
            <td>${v.likes}</td>
            <td>${v.comments}</td>
            <td>${v.status}</td>
        `;
        videoAuditTableBody.appendChild(tr);
    });
}

function renderKeywordPanel(data) {
    keywordPanel.innerHTML = '';
    data.keywords.forEach(k => {
        const span = document.createElement('span');
        span.classList.add('keyword');
        span.textContent = k;
        keywordPanel.appendChild(span);
    });
}

function renderCompetitorCards(data) {
    competitorCards.innerHTML = '';
    data.competitors.forEach(c => {
        const card = document.createElement('div');
        card.classList.add('competitor-card');
        card.innerHTML = `
            <h4>${c.name}</h4>
            <p>Subscribers: ${c.subscribers}</p>
            <p>Avg Views: ${c.avgViews}</p>
            <p>Health Score: ${c.healthScore}</p>
            <p>Top Video: ${c.topVideo}</p>
            <p>Insight: ${c.insight}</p>
        `;
        competitorCards.appendChild(card);
    });
}

// --------------------------
// Mode & AI Badge
// --------------------------
function updateModeBadge(mode) {
    modeStatusBadge.textContent = `Mode: ${mode}`;
}

function updateAiBadge(status) {
    aiStatusBadge.textContent = status === 'gemini' ? 'AI Gemini Active' : 'Manual Fallback';
}

// --------------------------
// Copy & PDF
// --------------------------
copyBtn.addEventListener('click', () => {
    if (!lastResultText) return alert('No report to copy.');
    navigator.clipboard.writeText(lastResultText);
    alert('Report copied to clipboard!');
});

downloadBtn.addEventListener('click', () => {
    if (!lastResultText) return alert('No report to download.');
    window.print();
});

// --------------------------
// Competitor Input
// --------------------------
addCompetitorBtn.addEventListener('click', () => {
    const competitor = competitorInput.value.trim();
    if (!competitor) return alert('Enter competitor @handle');
    // Call backend to fetch competitor data (optional)
    alert(`Competitor ${competitor} added (demo)`);
});

// --------------------------
// Initialize
// --------------------------
analyzeBtn.addEventListener('click', analyzeChannel);
