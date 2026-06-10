import { google } from 'googleapis'

const youtube = google.youtube('v3')

export interface VideoItem {
  id: string
  title: string
  status: 'public' | 'scheduled' | 'private'
  scheduledDate?: string
  views: number
  likes: number
  thumbnail: string
}

export async function fetchChannelVideos(auth: any): Promise<VideoItem[]> {
  const res = await youtube.videos.list({
    auth,
    part: ['snippet', 'status', 'statistics', 'contentDetails'],
    mine: true,
    maxResults: 50,
    broadcastStatus: 'all', // ambil semua termasuk scheduled
  })

  const items: VideoItem[] = []

  res.data.items?.forEach((video) => {
    const status = video.status?.privacyStatus as 'public' | 'private' | 'scheduled'
    let scheduledDate: string | undefined = undefined

    if (status === 'scheduled') {
      scheduledDate = video.snippet?.scheduledStartTime || undefined
    }

    items.push({
      id: video.id || '',
      title: video.snippet?.title || '',
      status,
      scheduledDate,
      views: Number(video.statistics?.viewCount || 0),
      likes: Number(video.statistics?.likeCount || 0),
      thumbnail: video.snippet?.thumbnails?.medium?.url || '',
    })
  })

  return items
}
