import { NextRequest, NextResponse } from "next/server";

const DEFAULT_CHANNEL_ID = "UC0-YvjBnvRrDCebWvKqV0cA";
const DEFAULT_CHANNEL_URL = "https://www.youtube.com/@Coding_Moves";

interface VideoEntry {
  id: string;
  title: string;
}

function extractVideoIdsFromFeed(xml: string): VideoEntry[] {
  const ids: VideoEntry[] = [];
  const idPattern = /<yt:videoId>([^<]+)<\/yt:videoId>/g;
  const titlePattern = /<title>([^<]+)<\/title>/g;
  const titles: string[] = [];

  let titleMatch = titlePattern.exec(xml);
  while (titleMatch) {
    titles.push(titleMatch[1]);
    titleMatch = titlePattern.exec(xml);
  }

  let idMatch = idPattern.exec(xml);
  let index = 0;
  while (idMatch) {
    if (idMatch[1]) {
      const title = titles[index + 1] ?? "YouTube Video";
      ids.push({ id: idMatch[1], title });
    }
    index += 1;
    idMatch = idPattern.exec(xml);
  }

  return ids;
}

async function fetchVideosFromDataApi(apiKey: string, channelId: string): Promise<VideoEntry[]> {
  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search?key=${encodeURIComponent(apiKey)}` +
    `&channelId=${encodeURIComponent(channelId)}` +
    "&part=snippet&type=video&maxResults=50";

  const apiResponse = await fetch(searchUrl, {
    cache: "no-store",
  });

  if (!apiResponse.ok) {
    throw new Error(`YouTube Data API returned ${apiResponse.status}`);
  }

  const data = (await apiResponse.json()) as {
    items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string } }>;
  };

  return (data.items ?? [])
    .filter((item) => Boolean(item.id?.videoId))
    .map((item) => ({
      id: item.id?.videoId as string,
      title: item.snippet?.title ?? "YouTube Video",
    }));
}

async function fetchVideosFromFeed(channelId: string): Promise<VideoEntry[]> {
  const feedResponse = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    cache: "no-store",
  });

  if (!feedResponse.ok) {
    throw new Error(`YouTube feed returned ${feedResponse.status}`);
  }

  const xml = await feedResponse.text();
  return extractVideoIdsFromFeed(xml);
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.YT_API_KEY;
    const channelId = request.nextUrl.searchParams.get("channelId") ?? DEFAULT_CHANNEL_ID;
    const channelUrl = request.nextUrl.searchParams.get("channelUrl") ?? DEFAULT_CHANNEL_URL;

    let videos: VideoEntry[] = [];
    let apiFailed = false;

    if (apiKey) {
      try {
        videos = await fetchVideosFromDataApi(apiKey, channelId);
      } catch (error) {
        apiFailed = true;
        console.error("[youtube] Data API fetch failed, falling back to feed", error);
      }
    }

    if (!apiKey || apiFailed || videos.length === 0) {
      videos = await fetchVideosFromFeed(channelId);
    }

    if (videos.length === 0) {
      return NextResponse.json({ error: "No videos found for channel" }, { status: 404 });
    }

    const randomIndex = Math.floor(Math.random() * videos.length);
    const randomVideo = videos[randomIndex];
    const videoId = randomVideo.id;
    const title = randomVideo.title;

    return NextResponse.json({
      channelUrl,
      channelId,
      videoId,
      title,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });
  } catch (error) {
    console.error("[youtube] random video fetch failed", error);
    return NextResponse.json({ error: "Unable to fetch channel videos" }, { status: 502 });
  }
}
