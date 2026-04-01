/**
 * OpenRouter (Qwen) — FREE tier, no credit card needed
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
      'HTTP-Referer': 'https://hiveminds-olive.vercel.app',
      'X-Title': 'HiveMinds',
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.6-plus-preview:free',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  // Some models return content directly, others use reasoning format
  const content = data.choices?.[0]?.message?.content;
  if (content) return content;
  // Fallback: check reasoning field
  const reasoning = data.choices?.[0]?.message?.reasoning;
  if (reasoning) return reasoning;
  return '';
}
