import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  // fetch from all official sources
  const twitterRes = await fetch('/api/roblox/official/twitter');
  const twitterData = await twitterRes.json();

  const newsroomRes = await fetch('/api/roblox/official/newsroom');
  const newsroomData = await newsroomRes.json();

  const devforumRes = await fetch('/api/roblox/official/devforum');
  const devforumData = await devforumRes.json();

  // combine all topics
  const topics = [
    ...(twitterData.topics || []),
    ...(newsroomData.topics || []),
    ...(devforumData.topics || [])
  ];

  return NextResponse.json({ success:true, source:'official-all', topics });
}
