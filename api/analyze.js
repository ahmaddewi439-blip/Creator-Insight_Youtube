const fetch = require('node-fetch');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_BASE_URL = process.env.AI_BASE_URL;
const AI_MODEL = process.env.AI_MODEL;

// --------------------------
// Helper Functions
// --------------------------
function normalizeKeyword(keyword) {
    return keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isNoiseKeyword(k) {
    const noise = ['https', 'com', 'www', '000', '2026'];
    return noise.some(n => k.includes(n));
}

function keywordCounts(keywords) {
    const counts = {};
    keywords.forEach(k => {
        const norm = normalizeKeyword(k);
        if (!isNoiseKeyword(norm)) {
            counts[norm] = (counts[norm] || 0) + 1;
        }
    });
    return counts;
}

// --------------------------
// Competitor Insight
// --------------------------
function buildCompetitorInsight(competitorData) {
    // Simple comparison for demo purposes
    return competitorData.map(c => ({
        name: c.name,
        subscribers: c.subscribers,
        avgViews: c.avgViews,
        healthScore: c.healthScore,
        topVideo: c.topVideo,
        insight: c.healthScore > 70 ? 'Competitor strong' : 'Opportunity to improve'
    }));
}

// --------------------------
// AI Gemini Call
// --------------------------
async function callGeminiAi(prompt) {
    try {
        const res = await fetch(AI_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    } catch (err) {
        console.error('AI Gemini error', err);
        return null;
    }
}

// --------------------------
// Main Handler
// --------------------------
module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).end();

    const { channel } = req.body;
    if (!channel) return res.status(400).json({ error: 'Channel required' });

    try {
        // --------------------------
        // Fetch Channel Data
        // --------------------------
        const channelResp = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channel}&key=${YOUTUBE_API_KEY}`);
        const channelData = await channelResp.json();
        const ch = channelData.items[0];

        const subscribers = parseInt(ch.statistics.subscriberCount);
        const totalViews = parseInt(ch.statistics.viewCount);
        const totalVideos = parseInt(ch.statistics.videoCount);

        // --------------------------
        // Fetch Videos
        // --------------------------
        const videosResp = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel}&maxResults=30&order=date&type=video&key=${YOUTUBE_API_KEY}`);
        const videosData = await videosResp.json();

        const videoAudit = [];
        const keywords = [];

        for (const v of videosData.items) {
            const vidId = v.id.videoId;
            const statsResp = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${vidId}&key=${YOUTUBE_API_KEY}`);
            const statsData = await statsResp.json();
            const vid = statsData.items[0];
            const views = parseInt(vid.statistics.viewCount);
            const likes = parseInt(vid.statistics.likeCount || 0);
            const comments = parseInt(vid.statistics.commentCount || 0);
            const title = vid.snippet.title;

            videoAudit.push({
                title,
                views,
                likes,
                comments,
                status: views > 10000 ? 'Winner' : views > 1000 ? 'Normal' : 'Weak'
            });

            keywords.push(...title.split(' '));
        }

        const cleanedKeywords = Object.keys(keywordCounts(keywords));

        // --------------------------
        // Scores & Trend
        // --------------------------
        const trend = {
            labels: videoAudit.map((_, i) => `Video ${i+1}`),
            views: videoAudit.map(v => v.views)
        };
        const healthScore = Math.min(100, Math.round(subscribers / 1000 + totalViews / 10000));

        // --------------------------
        // Competitor Demo
        // --------------------------
        const competitorsRaw = req.body.competitors || [];
        const competitors = buildCompetitorInsight(competitorsRaw);

        // --------------------------
        // AI Report
        // --------------------------
        const prompt = `Analyze channel ${channel} with videos and provide diagnosis, SEO, action plan, title formula, and content ideas.`;
        const aiReport = await callGeminiAi(prompt);

        const mode = 'Lite'; // demo: Lite / Pro / Max
        const aiStatus = aiReport ? 'gemini' : 'manual';

        // --------------------------
        // Response
        // --------------------------
        res.status(200).json({
            channelName: ch.snippet.title,
            subscribers,
            totalViews,
            totalVideos,
            healthScore,
            trend,
            videoAudit,
            keywords: cleanedKeywords,
            actionPlan: aiReport || 'Manual recommendations applied.',
            competitors,
            mode,
            aiStatus
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
};
