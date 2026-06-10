import { google } from 'googleapis'
import { getAuth } from './auth'

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

export async function fetchChannelVideos(): Promise<VideoItem[]> {
  const auth = await getAuth()
  const channelRes = await youtube.channels.list({
    auth,
    part: ['contentDetails'],
    mine: true,
  })

  const uploadsPlaylistId =
    channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

  if (!uploadsPlaylistId) return []

  const playlistRes = await youtube.playlistItems.list({
    auth,
    playlistId: uploadsPlaylistId,
    part: ['snippet', 'contentDetails'],
    maxResults: 50,
  })

  const videos: VideoItem[] =
    playlistRes.data.items?.map((item: any) => ({
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      status: 'public',
      thumbnail: item.snippet.thumbnails?.medium?.url,
    })) || []

  return videos
}
