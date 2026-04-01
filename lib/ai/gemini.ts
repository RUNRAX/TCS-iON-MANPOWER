/**
 * lib/ai/gemini.ts — Singleton Gemini client
 * Uses @google/generative-ai with the Flash model for fast, free responses.
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;
let _model: GenerativeModel | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    const key = process.env.GOOGLE_GEMINI_API_KEY;
    if (!key) throw new Error("GOOGLE_GEMINI_API_KEY is not set in environment variables.");
    _client = new GoogleGenerativeAI(key);
  }
  return _client;
}

/** Returns the Gemini Flash model (fast, generous free tier) */
export function getModel(): GenerativeModel {
  if (!_model) {
    _model = getClient().getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  return _model;
}

/** Generate text from a prompt — simple wrapper */
export async function generateText(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/** Generate JSON from a prompt — parses the response */
export async function generateJSON<T>(prompt: string): Promise<T> {
  const text = await generateText(
    `${prompt}\n\nRespond with ONLY valid JSON. No markdown, no code fences, no explanation.`
  );
  // Strip any accidental markdown
  const clean = text.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
  return JSON.parse(clean) as T;
}
