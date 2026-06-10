import { useEffect, useState } from 'react'
import { fetchChannelVideos, VideoItem } from '../lib/youtube/fetchVideos'
import { getAuth } from '../lib/youtube/auth' // path sudah sesuai struktur

export default function VideoOptimizerPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(false)

  async function loadVideos() {
    setLoading(true)
    try {
      const auth = await getAuth()
      const data = await fetchChannelVideos(auth)
      setVideos(data)
    } catch (err) {
      console.error('Error fetching videos', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadVideos()
  }, [])

  function handleOptimize(videoId: string) {
    console.log('Optimize clicked for video', videoId)
    // Logic optimize bisa dipanggil di sini
  }

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
                    onClick={() => handleOptimize(video.id)}
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
