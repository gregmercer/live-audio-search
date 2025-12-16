import { GoogleGenAI } from '@google/genai';

export class GeminiWebSearch {
    private ai: GoogleGenAI;

    constructor(apiKey: string) {
        this.ai = new GoogleGenAI({ apiKey });
    }

    async searchWeb(query: string): Promise<string> {
        try {
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
        } catch (error) {
            console.error('Error performing web search:', error);
            throw new Error(`Web search failed: ${error}`);
        }
    }

    async getCurrentEvents(topic?: string): Promise<string> {
        const query = topic
            ? `What are the latest news and current events about ${topic}?`
            : 'What are the top current events and news happening today?';

        return this.searchWeb(query);
    }

    async getWeather(location: string): Promise<string> {
        return this.searchWeb(`What is the current weather in ${location}?`);
    }

    async getStockInfo(symbol: string): Promise<string> {
        return this.searchWeb(`What is the current stock price and recent news for ${symbol}?`);
    }
}

// Usage example
export async function initializeGeminiSearch() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required');
    }

    return new GeminiWebSearch(apiKey);
}
