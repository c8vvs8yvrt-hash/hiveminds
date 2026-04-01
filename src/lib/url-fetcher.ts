/**
 * Fetch text content from a URL for inclusion in AI prompts.
 */
export async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'HiveMinds/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return `[Could not fetch URL: ${response.status}]`;
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      const html = await response.text();
      // Strip HTML tags, scripts, styles — get plain text
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      // Limit to ~2000 chars to not overwhelm the prompt
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
