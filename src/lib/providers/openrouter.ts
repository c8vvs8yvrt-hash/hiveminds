/**
 * OpenRouter (DeepSeek) — FREE tier, no credit card needed
 * Get key at: https://openrouter.ai
 */
export async function callOpenRouter(
  prompt: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('No OpenRouter API key available');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': 'https://hiveminds.app',
      'X-Title': 'HiveMinds',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat:free',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}
