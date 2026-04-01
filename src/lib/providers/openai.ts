/**
 * OpenAI GPT-4o-mini — paid API key required
 * Get key at: https://platform.openai.com/api-keys
 */
export async function callOpenAI(
  prompt: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error('No OpenAI API key available');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}
