export interface GeminiImage {
  base64: string;
  mimeType: string;
}

interface GeminiRequest {
  apiKey: string;
  image: GeminiImage;
  prompt: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

const MAX_503_RETRIES = 2;
const MAX_RETRY_DELAY_MS = 10_000;

function getRetryDelay(response: Response, retryNumber: number): number {
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    const retryAt = Date.parse(retryAfter);
    const delay = Number.isFinite(seconds)
      ? seconds * 1000
      : Number.isNaN(retryAt)
        ? null
        : retryAt - Date.now();

    if (delay !== null && delay > 0) {
      return Math.min(delay, MAX_RETRY_DELAY_MS);
    }
  }

  return Math.min(1000 * 2 ** (retryNumber - 1), MAX_RETRY_DELAY_MS);
}

export async function generateGeminiContent({
  apiKey,
  image,
  prompt,
}: GeminiRequest): Promise<string> {
  const endpoint = new URL(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
  );
  endpoint.searchParams.set('key', apiKey);

  const request = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: image.mimeType, data: image.base64 } },
          ],
        },
      ],
    }),
  };

  let response: Response;
  for (let attempt = 0; ; attempt += 1) {
    response = await fetch(endpoint, request);
    if (response.status !== 503 || attempt >= MAX_503_RETRIES) break;
    await new Promise((resolve) =>
      setTimeout(resolve, getRetryDelay(response, attempt + 1)),
    );
  }

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error(
        'Gemini is temporarily overloaded (503). The request was retried automatically; please wait a moment and try again.',
      );
    }
    const errorBody = await response.text();
    throw new Error(`API Error (${response.status}): ${errorBody}`);
  }

  const responseData: unknown = await response.json();
  if (
    typeof responseData !== 'object' ||
    responseData === null ||
    !('candidates' in responseData) ||
    !Array.isArray(responseData.candidates) ||
    responseData.candidates.length === 0
  ) {
    throw new Error('The Gemini API returned no analysis. Please try again.');
  }

  const candidate: unknown = (responseData as GeminiResponse).candidates?.[0];
  if (
    typeof candidate !== 'object' ||
    candidate === null ||
    !('content' in candidate) ||
    typeof candidate.content !== 'object' ||
    candidate.content === null ||
    !('parts' in candidate.content) ||
    !Array.isArray(candidate.content.parts) ||
    typeof candidate.content.parts[0] !== 'object' ||
    candidate.content.parts[0] === null ||
    !('text' in candidate.content.parts[0]) ||
    typeof candidate.content.parts[0].text !== 'string'
  ) {
    throw new Error('The Gemini API returned an invalid analysis. Please try again.');
  }

  return candidate.content.parts[0].text;
}
