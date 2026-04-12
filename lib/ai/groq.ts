/**
 * lib/ai/groq.ts — Groq AI client (Llama 3.1)
 * Replaces Gemini to avoid IP-shared quota issues on Vercel free tier.
 * Uses Groq's llama-3.1-8b-instant — 14,400 RPD free, no IP sharing.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === "your-groq-api-key") {
    throw new Error(
      "AI service is not configured. GROQ_API_KEY is missing or set to placeholder. Please contact your administrator."
    );
  }
  return key;
}

/**
 * Call Groq chat completions with retry on 429.
 */
async function callGroq(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 800,
  temperature = 0.1
): Promise<string> {
  const apiKey = getApiKey();

  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    // Handle 429 rate limit — wait 2s and retry once
    if (response.status === 429 && attempt === 1) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `Groq API error: ${response.status} ${response.statusText} — ${errorBody}`
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  throw new Error("Groq API: all retry attempts exhausted");
}

/** Generate text from a prompt — simple wrapper */
export async function generateText(prompt: string): Promise<string> {
  return callGroq(
    "You are a helpful assistant. Respond concisely and accurately.",
    prompt,
    800,
    0.3
  );
}

/** Generate JSON from a prompt — parses the response */
export async function generateJSON<T>(prompt: string): Promise<T> {
  const text = await callGroq(
    "You are a helpful assistant that responds ONLY with valid JSON. No markdown, no code fences, no explanation.",
    `${prompt}\n\nRespond with ONLY valid JSON. No markdown, no code fences, no explanation.`,
    800,
    0.1
  );
  // Strip any accidental markdown
  const clean = text.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
  return JSON.parse(clean) as T;
}
