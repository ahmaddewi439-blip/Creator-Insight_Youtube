import { useEffect, useState } from 'react'

interface VideoItem {
  id: string
  title: string
  status: 'public' | 'scheduled' | 'private'
  scheduledDate?: string
  views: number
  likes: number
  thumbnail: string
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
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Video Optimizer</h1>
      {loading ? (
        <p>Loading videos...</p>
      ) : (
        <table className="table-auto border-collapse border border-gray-300 w-full">
          <thead>
            <tr>
              <th className="border px-2 py-1">Video</th>
              <th className="border px-2 py-1">Views</th>
              <th className="border px-2 py-1">Likes</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id}>
                <td className="border px-2 py-1">{video.title}</td>
                <td className="border px-2 py-1">{video.views}</td>
                <td className="border px-2 py-1">{video.likes}</td>
                <td className="border px-2 py-1">
                  {video.status === 'public' && (
                    <span className="text-green-600 font-semibold">Public</span>
                  )}
                  {video.status === 'scheduled' && (
                    <span className="text-blue-600 font-semibold">
                      Scheduled ({video.scheduledDate})
                    </span>
                  )}
                  {video.status === 'private' && (
                    <span className="text-gray-400 font-semibold">Private</span>
                  )}
                </td>
                <td className="border px-2 py-1">
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded"
                    onClick={() => console.log('Optimize', video.id)}
                  >
                    Optimize
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-4">
        <button
          className="bg-blue-500 text-white px-3 py-2 rounded"
          onClick={loadVideos}
        >
          Refresh Data
        </button>
      </div>
    </div>
  )
}
