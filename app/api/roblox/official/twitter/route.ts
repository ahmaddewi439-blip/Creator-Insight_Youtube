import { NextResponse } from "next/server";

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

export const runtime = "edge";

export async function GET() {
  const username = "Roblox";
  const userRes = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
    headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
  });
  const userData = await userRes.json();
  const userId = userData.data?.id;
  if (!userId) return NextResponse.json({ success:false, error: "Cannot get user ID" });

  const tweetsRes = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?tweet.fields=created_at`,
    { headers: { Authorization: `Bearer ${BEARER_TOKEN}` } }
  );
  const tweets = await tweetsRes.json();

  return NextResponse.json({ success: true, source:"twitter", topics: tweets.data || [] });
}
