export default async function handler(req, res) {
  const q = req.query.q;

  res.json({
    keywords: [
      q + " secrets",
      q + " hidden",
      q + " explained",
      q + " mystery"
    ]
  });
}