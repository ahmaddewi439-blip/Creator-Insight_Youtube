import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchChannelVideos, VideoItem } from '../../../lib/youtube/fetchVideos'
import { getAuth } from '../../../lib/youtube/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = await getAuth()
    const videos: VideoItem[] = await fetchChannelVideos(auth)
    res.status(200).json(videos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch videos' })
  }
}
