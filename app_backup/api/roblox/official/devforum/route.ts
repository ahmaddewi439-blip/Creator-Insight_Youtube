import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch('https://devforum.roblox.com/c/updates/announcements/36');
    const html = await res.text();
    const topics = html.match(/<a href="(\/t\/.*?)">([^<]+)<\/a>/g)?.slice(0,5) || [];

    return NextResponse.json({ success:true, source:"devforum", topics });
  } catch(err) {
    return NextResponse.json({ success:false, error: err.message });
  }
}
