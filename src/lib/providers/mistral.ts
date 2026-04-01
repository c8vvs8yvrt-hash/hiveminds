/**
 * Mistral AI — FREE tier, no credit card needed
 * Get key at: https://console.mistral.ai
 */
export async function callMistral(
  prompt: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || process.env.MISTRAL_API_KEY;
  if (!key) throw new Error('No Mistral API key available');

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mistral API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}
