// api/analyze.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { channelData, videoStats } = req.body;

  if (!channelData || !videoStats) {
    return res.status(400).json({ error: 'channelData dan videoStats diperlukan' });
  }

  const AI_BASE_URL = process.env.AI_BASE_URL; // https://lite.koboillm.com/v1
  const AI_MODEL = process.env.AI_MODEL; // gemini/gemini-2.5-flash-lite
  const AI_API_KEY = process.env.AI_API_KEY; // sk-xxxxxxx

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
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
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

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || 'Tidak ada hasil dari AI';
    res.status(200).json({ aiText });

  } catch (err) {
    console.error('Gemini AI error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat memanggil AI' });
  }
}
