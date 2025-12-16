import { GoogleGenAI } from "@google/genai";

// Example of how to integrate web search into your existing app
export class WebSearchIntegration {
    private ai: GoogleGenAI;

    constructor(apiKey: string) {
        this.ai = new GoogleGenAI({ apiKey });
    }

    // Your exact pattern implementation
    async searchWithGrounding(query: string): Promise<string> {
        const groundingTool = {
            googleSearch: {},
        };

        const config = {
            tools: [groundingTool],
        };

        const response = await this.ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: query,
            config,
        });

        return response.text;
    }

    // Integration with your audio component
    async handleUserQuery(userInput: string): Promise<string> {
        // Check if the query needs current information
        const needsWebSearch = this.requiresCurrentInfo(userInput);

        if (needsWebSearch) {
            console.log('🔍 Using web search for current information...');
            return await this.searchWithGrounding(userInput);
        } else {
            // Use regular Gemini without search for general queries
            const response = await this.ai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: userInput,
            });
            return response.text;
        }
    }

    private requiresCurrentInfo(query: string): boolean {
        const currentInfoKeywords = [
            'today', 'now', 'current', 'latest', 'recent', 'news',
            'weather', 'stock', 'price', 'happening', 'events',
            'who won', 'winner', 'score', 'results'
        ];

        return currentInfoKeywords.some(keyword =>
            query.toLowerCase().includes(keyword)
        );
    }
}

// Usage example for your audio app
async function exampleUsage() {
    const apiKey = process.env.GEMINI_API_KEY!;
    const webSearch = new WebSearchIntegration(apiKey);

    // These will use web search automatically
    console.log(await webSearch.handleUserQuery("Who won the Euro 2024?"));
    console.log(await webSearch.handleUserQuery("What's the weather today?"));
    console.log(await webSearch.handleUserQuery("Latest tech news"));

    // This will use regular Gemini (no web search needed)
    console.log(await webSearch.handleUserQuery("Explain how JavaScript works"));
}
