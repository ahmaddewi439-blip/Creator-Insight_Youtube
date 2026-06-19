export default async function handler(req, res) {
  res.json({
    score: Math.floor(Math.random() * 40) + 60
  });
}