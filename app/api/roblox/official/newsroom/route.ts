import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch('https://about.roblox.com/newsroom');
    const html = await res.text();

    // NOTE: parsing HTML / scraping simple demo (implement proper parser)
    const topics = html.match(/<a href="(\/newsroom\/.*?)">([^<]+)<\/a>/g)?.slice(0,5) || [];

    return NextResponse.json({ success:true, source:"newsroom", topics });
  } catch(err) {
    return NextResponse.json({ success:false, error: err.message });
  }
}
