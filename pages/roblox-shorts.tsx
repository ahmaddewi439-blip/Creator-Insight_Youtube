import { useEffect, useState } from 'react'
import type { VideoItem } from '../app/lib/youtube/fetchVideos'

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
    <div style={{ padding: '20px' }}>
      <h1>Video Optimizer</h1>
      {loading ? (
        <p>Loading videos...</p>
      ) : (
        <ul>
          {videos.map((v) => (
            <li key={v.id}>
              <img src={v.thumbnail} alt={v.title} width={120} />
              <strong>{v.title}</strong>
              <span> ({v.publishedAt})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
