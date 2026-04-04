/**
 * Trusted Source Retrieval System
 *
 * Searches the web for relevant sources, ranks them by trust tier,
 * and extracts key facts to ground AI responses in reality.
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  tier: 1 | 2 | 3;
  tierLabel: string;
}

export interface RetrievalResult {
  sources: SearchResult[];
  sourceContext: string;  // Formatted text to inject into prompts
}

// Tier 1: Highest trust — government, academic, peer-reviewed
const TIER_1_DOMAINS = [
  'gov', 'edu', 'nasa.gov', 'cdc.gov', 'nih.gov', 'who.int', 'un.org',
  'nature.com', 'science.org', 'sciencedirect.com', 'pubmed.ncbi',
  'arxiv.org', 'springer.com', 'wiley.com', 'ieee.org', 'acm.org',
  'britannica.com', 'stanford.edu', 'mit.edu', 'harvard.edu',
  'ox.ac.uk', 'cam.ac.uk', 'mayoclinic.org', 'clevelandclinic.org',
];

// Tier 2: High trust — reputable news and reference
const TIER_2_DOMAINS = [
  'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'npr.org',
  'nytimes.com', 'washingtonpost.com', 'theguardian.com',
  'wikipedia.org', 'investopedia.com', 'healthline.com',
  'webmd.com', 'khanacademy.org', 'coursera.org',
  'stackoverflow.com', 'developer.mozilla.org', 'docs.python.org',
  'microsoft.com', 'apple.com', 'google.com',
];

function classifySource(url: string): { tier: 1 | 2 | 3; tierLabel: string } {
  const domain = url.toLowerCase();

  // Check Tier 1
  for (const d of TIER_1_DOMAINS) {
    if (domain.includes(d)) {
      return { tier: 1, tierLabel: 'Verified Source' };
    }
  }

  // Check .gov and .edu TLDs
  if (domain.match(/\.(gov|edu|ac\.[a-z]{2})\b/)) {
    return { tier: 1, tierLabel: 'Verified Source' };
  }

  // Check Tier 2
  for (const d of TIER_2_DOMAINS) {
    if (domain.includes(d)) {
      return { tier: 2, tierLabel: 'Reputable Source' };
    }
  }

  return { tier: 3, tierLabel: 'General Source' };
}

/**
 * Search using Brave Search API (free tier: 2000 queries/month)
 */
async function searchBrave(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const results: SearchResult[] = [];

    for (const item of data.web?.results || []) {
      const { tier, tierLabel } = classifySource(item.url);
      results.push({
        title: item.title || '',
        url: item.url || '',
        snippet: item.description || '',
        tier,
        tierLabel,
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Fallback: DuckDuckGo Instant Answer API (no key needed, limited)
 */
async function searchDDG(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const results: SearchResult[] = [];

    // Abstract (main result)
    if (data.Abstract && data.AbstractURL) {
      const { tier, tierLabel } = classifySource(data.AbstractURL);
      results.push({
        title: data.Heading || 'Summary',
        url: data.AbstractURL,
        snippet: data.Abstract,
        tier,
        tierLabel,
      });
    }

    // Related topics
    for (const topic of (data.RelatedTopics || []).slice(0, 5)) {
      if (topic.FirstURL && topic.Text) {
        const { tier, tierLabel } = classifySource(topic.FirstURL);
        results.push({
          title: topic.Text.split(' - ')[0] || '',
          url: topic.FirstURL,
          snippet: topic.Text,
          tier,
          tierLabel,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Determine if a question needs web search for grounding.
 * Skip search for: greetings, creative writing, personal opinions, code requests
 */
function needsRetrieval(question: string): boolean {
  const q = question.toLowerCase().trim();
  const words = q.split(/\s+/);

  // Too short to need search
  if (words.length <= 2) return false;

  // Greetings / chat
  if (/^(hi|hello|hey|thanks|thank you|ok|sure|yes|no|go|do it)\b/i.test(q)) return false;

  // Creative / writing tasks (no facts to verify)
  if (/^(write|create|compose|draft|generate|make up|imagine|pretend)/i.test(q)) return false;

  // Code requests
  if (/^(code|build|implement|fix|debug|refactor)\b/i.test(q)) return false;

  // Follow-up commands
  if (/^(make it|rewrite|simplify|expand|shorter|longer|more detail)/i.test(q)) return false;

  // Math
  if (/^\d+\s*[+\-*/]\s*\d+/.test(q)) return false;

  // Factual / knowledge questions likely benefit from search
  return true;
}

/**
 * Main retrieval function.
 * Searches the web, ranks by trust tier, and formats for prompt injection.
 */
export async function retrieveSources(question: string): Promise<RetrievalResult> {
  const empty: RetrievalResult = { sources: [], sourceContext: '' };

  if (!needsRetrieval(question)) {
    return empty;
  }

  // Try Brave first, fall back to DDG
  let results = await searchBrave(question);
  if (results.length === 0) {
    results = await searchDDG(question);
  }

  if (results.length === 0) {
    return empty;
  }

  // Sort by tier (Tier 1 first) then by position
  results.sort((a, b) => a.tier - b.tier);

  // If Tier 1 sources exist, deprioritize Tier 3
  const hasTier1 = results.some((r) => r.tier === 1);
  if (hasTier1) {
    results = results.filter((r) => r.tier <= 2).concat(
      results.filter((r) => r.tier === 3).slice(0, 1)
    );
  }

  // Take top 6
  const topResults = results.slice(0, 6);

  // Format for prompt injection
  const sourceContext = formatSourceContext(topResults);

  return { sources: topResults, sourceContext };
}

function formatSourceContext(sources: SearchResult[]): string {
  if (sources.length === 0) return '';

  const lines = sources.map((s, i) => {
    return `[Source ${i + 1}] (${s.tierLabel}) ${s.title}\n${s.snippet}\nURL: ${s.url}`;
  });

  return `\n=== VERIFIED REFERENCE SOURCES ===\nUse these sources to ground your answer in verified facts. Prioritize "Verified Source" over others.\n\n${lines.join('\n\n')}\n=== END SOURCES ===\n`;
}
