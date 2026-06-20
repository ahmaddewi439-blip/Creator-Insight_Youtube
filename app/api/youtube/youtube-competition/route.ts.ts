import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { keyword } = body;
    
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "YouTube API Key belum dipasang" }, { status: 500 });
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=10&order=relevance&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      throw new Error(searchData.error?.message || "Gagal menembus server YouTube");
    }

    return NextResponse.json({ 
      success: true, 
      keyword: keyword,
      totalResults: searchData.pageInfo?.totalResults || 0,
      competitors: (searchData.items || []).map((item: any) => ({
        title: item.snippet.title,
        videoId: item.id.videoId
      }))
    });

  } catch (error: any) {
    console.error("YouTube API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}