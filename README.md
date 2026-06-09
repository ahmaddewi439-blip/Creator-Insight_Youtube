# Creator Insight YouTube Analyzer + Roblox Shorts Creator

Project Next.js siap deploy ke Vercel untuk tool pribadi:

- Login channel YouTube memakai Google OAuth + YouTube readonly scope
- Dashboard channel
- Video Optimizer untuk judul, deskripsi, caption, hashtag, keyword, CTA, pinned comment
- Competitor Research dengan search channel YouTube
- Roblox Shorts Creator:
  - Search update/berita/topik Roblox terbaru dari sinyal YouTube search
  - Pilihan bahasa English / Indonesia
  - Durasi 45 / 60 detik
  - Style VO: Natural News, Excited Gaming, Mystery, Fun Facts
  - Generate 5 scene
  - 2 prompt gambar per scene
  - VO natural per scene
  - Full VO copy-ready
  - Arahan gameplay yang cocok dimainkan
  - Caption, description, hashtags, thumbnail text, pinned comment
  - Hook 3 detik pertama wajib kuat
  - CTA ending wajib kuat agar penonton comment, like, dan subscribe/follow

## Environment Variables Vercel

Isi di Vercel > Project > Settings > Environment Variables:

```env
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=generate_random_secret_minimum_32_characters

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
YOUTUBE_API_KEY=your_youtube_data_api_key

AI_BASE_URL=https://lite.koboillm.com/v1
AI_MODEL=openai/gpt-4o-mini
AI_API_KEYS=your_koboi_virtual_key_1,your_koboi_virtual_key_2
```

Jangan pakai slash `/` di akhir `NEXTAUTH_URL`.

## Google Cloud Setup

1. Buat Google Cloud Project.
2. Enable **YouTube Data API v3**.
3. OAuth consent screen:
   - App type: External atau sesuai kebutuhan.
   - Tambahkan test user email kamu jika masih Testing.
   - Scope: `https://www.googleapis.com/auth/youtube.readonly`
4. Credentials > Create OAuth Client ID > Web Application.
5. Authorized JavaScript origins:

```txt
https://your-vercel-domain.vercel.app
```

6. Authorized redirect URIs:

```txt
https://your-vercel-domain.vercel.app/api/auth/callback/google
```

7. Copy Client ID dan Client Secret ke Vercel.
8. Credentials > Create API Key untuk `YOUTUBE_API_KEY`.

## Koboi LLM

Gunakan virtual key dari Koboi LLM, bukan Key ID.

```env
AI_BASE_URL=https://lite.koboillm.com/v1
AI_MODEL=openai/gpt-4o-mini
AI_API_KEYS=your_virtual_key
```

Kalau banyak key, pisahkan dengan koma tanpa spasi:

```env
AI_API_KEYS=key1,key2,key3,key4,key5,key6,key7,key8,key9
```

## Deploy

1. Extract ZIP.
2. Upload semua isi folder ke GitHub repository kamu.
3. Import repository ke Vercel.
4. Isi Environment Variables.
5. Redeploy.
6. Buka domain Vercel dan login Google.

## Catatan

- Project ini memakai akses read-only untuk YouTube, jadi tidak mengubah video/channel kamu.
- Untuk video scheduled/private, data yang tampil bergantung pada akses YouTube API dan status video yang bisa dibaca melalui uploads playlist dengan OAuth.
- Fitur upload atau update metadata otomatis belum diaktifkan agar OAuth tetap lebih sederhana dan aman.
