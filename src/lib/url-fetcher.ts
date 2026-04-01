/**
 * Extract YouTube video ID from various YouTube URL formats.
 */
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fetch YouTube video info using oEmbed API (no API key needed).
 */
async function fetchYouTubeInfo(videoId: string): Promise<string> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return `[YouTube video ID: ${videoId}]`;
    const data = await response.json();
    return `YouTube Video: "${data.title}" by ${data.author_name}`;
  } catch {
    return `[YouTube video ID: ${videoId}]`;
  }
}

/**
 * Extract meta tags (title, description) from HTML.
 */
function extractMetaTags(html: string): { title: string; description: string } {
  let title = '';
  let description = '';

  // Try og:title first, then <title>
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (ogTitle) {
    title = ogTitle[1];
  } else {
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleTag) title = titleTag[1];
  }

  // Try og:description, then meta description
  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  if (ogDesc) {
    description = ogDesc[1];
  } else {
    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    if (metaDesc) description = metaDesc[1];
  }

  return { title: title.trim(), description: description.trim() };
}

/**
 * Fetch text content from a URL for inclusion in AI prompts.
 */
export async function fetchUrlContent(url: string): Promise<string> {
  try {
    // Handle YouTube URLs specially
    const ytId = getYouTubeVideoId(url);
    if (ytId) {
      return fetchYouTubeInfo(ytId);
    }

    // Handle TikTok URLs — can only get basic info via oEmbed
    if (url.includes('tiktok.com')) {
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const data = await response.json();
          return `TikTok Video: "${data.title}" by ${data.author_name}`;
        }
      } catch { /* fall through */ }
      return `[TikTok link shared — cannot access video content directly]`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HiveMinds/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return `[Could not fetch URL: ${response.status}]`;
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      const html = await response.text();

      // First try to get structured info from meta tags
      const meta = extractMetaTags(html);
      let metaInfo = '';
      if (meta.title) metaInfo += `Title: ${meta.title}\n`;
      if (meta.description) metaInfo += `Description: ${meta.description}\n`;

      // Also get body text content
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (metaInfo) {
        return metaInfo + '\nContent:\n' + text.slice(0, 1500);
      }
      return text.slice(0, 2000);
    }

    if (contentType.includes('text/') || contentType.includes('application/json')) {
      const text = await response.text();
      return text.slice(0, 2000);
    }

    return `[URL contains non-text content: ${contentType}]`;
  } catch (error) {
    return `[Failed to fetch URL: ${error instanceof Error ? error.message : 'unknown error'}]`;
  }
}

/**
 * Detect URLs in text and return them.
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  return text.match(urlRegex) || [];
}
