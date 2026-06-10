import { google } from 'googleapis'

const youtube = google.youtube('v3')

export interface VideoItem {
  id: string
  title: string
  status: 'public' | 'scheduled' | 'private'
  scheduledDate?: string
  views?: number
  likes?: number
  thumbnail?: string
}

export async function fetchChannelVideos(auth: any): Promise<VideoItem[]> {
  const youtubeClient = youtube

  // Ambil playlist uploads dari channel
  const channelRes = await youtubeClient.channels.list({
    auth,
    part: ['contentDetails'],
    mine: true,
  })

  const uploadsPlaylistId =
    channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

  if (!uploadsPlaylistId) return []

  // Ambil video dari playlist
  const playlistRes = await youtubeClient.playlistItems.list({
    auth,
    playlistId: uploadsPlaylistId,
    part: ['snippet', 'contentDetails'],
    maxResults: 50,
  })

  const videos: VideoItem[] =
    playlistRes.data.items?.map((item: any) => ({
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      status: 'public', // playlistItems tidak punya status, default public
      thumbnail: item.snippet.thumbnails?.medium?.url,
    })) || []

  return videos
}
