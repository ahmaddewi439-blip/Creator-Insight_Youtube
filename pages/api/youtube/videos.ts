import { useEffect, useState } from 'react'

interface VideoItem {
  id: string
  title: string
  status: 'public' | 'scheduled' | 'private'
  scheduledDate?: string
  views?: number
  likes?: number
  thumbnail?: string
}

export default function VideoOptimizerPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(false)

  async function loadVideos() {
    setLoading(true)
    try {
      const res = await fetch('/api/youtube/videos')
      const data: VideoItem[] = await res.json()
      setVideos(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadVideos()
  }, [])

  return (
    <div>
      {/* Render table / UI sama seperti sebelumnya */}
    </div>
  )
}
