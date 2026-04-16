// agentWrappers.js

import { countTokens } from '@anthropic-ai/tokenizer';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { sessionTokens } from './tokenTracker.js';

// Initialize your SDKs (Make sure your .env has the API keys!)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


// --- CLAUDE OPUS INTERCEPTOR ---
export async function executeClaudeStep(agentContextArray) {
    // 1. Count Input locally
    const promptString = JSON.stringify(agentContextArray);
    const inputCost = countTokens(promptString);
    sessionTokens.claude.input += inputCost;

    // 2. Execute Model
    const response = await anthropic.messages.create({
        model: "claude-3-opus-20240229", // Opus 4.6 equivalent alias
        max_tokens: 4096,
        messages: agentContextArray
    });

    // 3. Count Output from API receipt
    sessionTokens.claude.output += response.usage.output_tokens;

    // 4. Log the running total to your terminal
    sessionTokens.logStats();

    return response.content[0].text;
}


// --- GEMINI PRO INTERCEPTOR ---
export async function executeGeminiStep(agentContextArray) {
    // 1. Fire BOTH the token counter and the model generator simultaneously
    const [countResult, response] = await Promise.all([
        ai.models.countTokens({
            model: 'gemini-3.1-pro',
            contents: agentContextArray
        }),
        ai.models.generateContent({
            model: 'gemini-3.1-pro',
            contents: agentContextArray
        })
    ]);

    // 2. Count Input & Output
    sessionTokens.gemini.input += countResult.totalTokens;
    sessionTokens.gemini.output += response.usageMetadata.candidatesTokenCount;

    // 3. Log the running total to your terminal
    sessionTokens.logStats();

    return response.text;
}