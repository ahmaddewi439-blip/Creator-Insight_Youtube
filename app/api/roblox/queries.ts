export type CreatorChannel = {
  title: string;
  username: string;
  thumbnail: string;
  subscriberCount: string;
  totalViews: string;
  totalVideos: string;
  joined: string;
};

export type CreatorVideo = {
  title: string;
  thumbnail: string;
  views: string;
  likes: string;
};

export type RobloxQuerySource = "DevForum" | "Newsroom" | "Roblox Official";

export type RobloxQueryItem = {
  id: string;
  title: string;
  source: RobloxQuerySource;
  url: string;
  summary: string;
  query: string;
  language: "EN" | "ID";
  priority: number;
};

export const robloxQueries: RobloxQueryItem[] = [
  {
    id: "roblox-devforum-updates",
    title: "Roblox Creator Updates",
    source: "DevForum",
    url: "https://devforum.roblox.com/",
    summary:
      "Latest Roblox creator updates, development discussions, and platform changes from DevForum.",
    query: "Roblox creator update DevForum latest",
    language: "EN",
    priority: 1,
  },
  {
    id: "roblox-newsroom-updates",
    title: "Roblox Newsroom Updates",
    source: "Newsroom",
    url: "https://corp.roblox.com/newsroom/",
    summary:
      "Official Roblox company news, product announcements, and platform updates from Roblox Newsroom.",
    query: "Roblox Newsroom official update latest",
    language: "EN",
    priority: 2,
  },
  {
    id: "roblox-official-social",
    title: "Roblox Official Social Updates",
    source: "Roblox Official",
    url: "https://x.com/Roblox",
    summary:
      "Official Roblox social updates that can be used as Roblox Shorts topics.",
    query: "Roblox official X update latest",
    language: "EN",
    priority: 3,
  },
];

export async function fetchChannels(): Promise<CreatorChannel[]> {
  return [
    {
      title: "Creator Insight",
      username: "creator-insight",
      thumbnail:
        "https://placehold.co/160x160/png?text=CI",
      subscriberCount: "-",
      totalViews: "-",
      totalVideos: "-",
      joined: "-",
    },
  ];
}

export async function fetchTopVideos(): Promise<CreatorVideo[]> {
  return [
    {
      title: "Roblox Shorts Topic Generator",
      thumbnail:
        "https://placehold.co/320x180/png?text=Roblox+Shorts",
      views: "-",
      likes: "-",
    },
  ];
}

export const ROBLOX_QUERIES = robloxQueries;
export const queries = robloxQueries;
export const robloxNewsQueries = robloxQueries;
export const robloxShortsQueries = robloxQueries;
export const officialRobloxQueries = robloxQueries;

export function getRobloxQueries() {
  return robloxQueries;
}

export async function fetchRobloxQueries() {
  return robloxQueries;
}

export function getTopRobloxQueries(limit = 6) {
  return [...robloxQueries]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit);
}

export default robloxQueries;