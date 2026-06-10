export function getAuth() {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY belum diisi di .env.local");
  }

  return apiKey;
}