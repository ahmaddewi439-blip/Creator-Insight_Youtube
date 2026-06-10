import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchChannelVideos, type VideoItem } from '../../../app/lib/youtube/fetchVideos'
import { getAuth } from '../../../app/lib/youtube/auth'

type ApiResponse = VideoItem[] | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    const auth = await getAuth()
    const videos = await fetchChannelVideos(auth)

    res.status(200).json(videos)
  } catch (error: any) {
    console.error('Failed to fetch YouTube videos:', error)
    res.status(500).json({
      error: error?.message || 'Failed to fetch YouTube videos',
    })
  }
}