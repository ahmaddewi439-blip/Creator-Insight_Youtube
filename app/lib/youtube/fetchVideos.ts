export interface VideoItem {
  id: string
  title: string
  status: 'public' | 'scheduled' | 'private' | 'unlisted'
  scheduledDate?: string
  views: number
  likes: number
  thumbnail: string
}

function getTokenValue(tokenResult: any): string {
  if (typeof tokenResult === 'string') return tokenResult
  if (tokenResult?.token) return tokenResult.token
  if (tokenResult?.res?.data?.access_token) return tokenResult.res.data.access_token
  throw new Error('Google access token not found')
}

async function fetchJson(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message || 'YouTube API request failed')
  }

  return data
}

export async function fetchChannelVideos(auth: any): Promise<VideoItem[]> {
  const tokenResult = await auth.getAccessToken()
  const accessToken = getTokenValue(tokenResult)

  const searchUrl =
    'https://www.googleapis.com/youtube/v3/search' +
    '?part=snippet' +
    '&forMine=true' +
    '&type=video' +
    '&order=date' +
    '&maxResults=50'

  const searchData = await fetchJson(searchUrl, accessToken)

  const ids = (searchData.items || [])
    .map((item: any) => item?.id?.videoId)
    .filter(Boolean)

  if (ids.length === 0) return []

  const videosUrl =
    'https://www.googleapis.com/youtube/v3/videos' +
    '?part=snippet,status,statistics,contentDetails' +
    `&id=${ids.join(',')}`

  const videosData = await fetchJson(videosUrl, accessToken)

  return (videosData.items || []).map((video: any) => {
    const privacyStatus = video?.status?.privacyStatus || 'private'
    const publishAt = video?.status?.publishAt

    const computedStatus =
      privacyStatus === 'private' && publishAt
        ? 'scheduled'
        : privacyStatus

    return {
      id: video.id || '',
      title: video?.snippet?.title || 'Untitled video',
      status: computedStatus,
      scheduledDate: publishAt || undefined,
      views: Number(video?.statistics?.viewCount || 0),
      likes: Number(video?.statistics?.likeCount || 0),
      thumbnail:
        video?.snippet?.thumbnails?.medium?.url ||
        video?.snippet?.thumbnails?.default?.url ||
        '',
    }
  })
}