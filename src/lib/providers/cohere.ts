/**
 * Cohere (Command R+) — FREE trial tier, no credit card needed
 * Get key at: https://dashboard.cohere.com
 */
export async function callCohere(
  prompt: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || process.env.COHERE_API_KEY;
  if (!key) throw new Error('No Cohere API key available');

  const response = await fetch('https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'command-a-03-2025',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cohere API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  // Cohere v2 returns { message: { content: [{ text: "..." }] } }
  return data.message?.content?.[0]?.text ?? '';
}
