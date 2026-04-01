/**
 * Google Gemini 2.5 Flash — FREE tier, no credit card needed
 * Get key at: https://aistudio.google.com
 */
export async function callGemini(
  prompt: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('No Gemini API key available');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 512 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}
