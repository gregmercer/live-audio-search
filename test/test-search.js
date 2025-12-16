import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGeminiWebSearch() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }

        console.log('🔍 Testing Gemini Web Search...\n');

        const ai = new GoogleGenAI({ apiKey });

        const groundingTool = {
            googleSearch: {},
        };

        const config = {
            tools: [groundingTool],
        };

        // Test query about Euro 2024 (your example)
        console.log('📋 Query: "Who won the euro 2024?"');
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: "Who won the euro 2024?",
            config,
        });
        console.log('✅ Response:', response.text);
        console.log('\n' + '='.repeat(50) + '\n');

        // Test current events
        console.log('📋 Query: "What are the latest tech news today?"');
        const response2 = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: "What are the latest tech news today?",
            config,
        });
        console.log('✅ Response:', response2.text);
        console.log('\n' + '='.repeat(50) + '\n');

        // Test weather
        console.log('📋 Query: "What is the weather like in San Francisco today?"');
        const response3 = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: "What is the weather like in San Francisco today?",
            config,
        });
        console.log('✅ Response:', response3.text);

    } catch (error) {
        console.error('❌ Error testing web search:', error.message);
    }
}

testGeminiWebSearch();
