import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchChannelVideos, type VideoItem } from '../../../app/lib/youtube/fetchVideos'

type ApiResponse = VideoItem[] | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    const videos = await fetchChannelVideos()
    res.status(200).json(videos)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Unknown error' })
  }
}
