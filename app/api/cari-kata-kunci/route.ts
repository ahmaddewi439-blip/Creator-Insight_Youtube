import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) return NextResponse.json({ error: 'Kata kunci tidak boleh kosong' }, { status: 400 });

    // Menembak langsung ke server Autocomplete rahasia milik Google/YouTube
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    const data = await response.json();

    // Data dari Google berbentuk array rahasia, index ke-1 berisi daftar kata kuncinya
    const suggestions = data[1] || [];

    return NextResponse.json({ success: true, result: suggestions });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}