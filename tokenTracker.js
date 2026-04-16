// tokenTracker.js

export const sessionTokens = {
    claude: { input: 0, output: 0 },
    gemini: { input: 0, output: 0 },

    logStats() {
        console.log("=== 📊 AGENT TOKEN USAGE ===");
        console.log(`Claude -> In: ${this.claude.input} | Out: ${this.claude.output}`);
        console.log(`Gemini -> In: ${this.gemini.input} | Out: ${this.gemini.output}`);
        console.log("============================");
    }
};