import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugSearch() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key present:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);

    const ai = new GoogleGenAI({ apiKey });

    // Test 1: Without grounding (should say it can't access internet)
    console.log('\n🔍 Test 1: WITHOUT grounding tools');
    try {
        const response1 = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: "What are today's headlines?",
        });
        console.log('Response:', response1.text.substring(0, 200) + '...');
    } catch (error) {
        console.log('Error:', error.message);
    }

    // Test 2: With grounding (should work)
    console.log('\n🔍 Test 2: WITH grounding tools');
    try {
        const response2 = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: "What are today's headlines?",
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        console.log('Response:', response2.text.substring(0, 200) + '...');
    } catch (error) {
        console.log('Error:', error.message);
    }

    // Test 3: Different query format
    console.log('\n🔍 Test 3: Different query format');
    try {
        const response3 = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: [{ parts: [{ text: "What are today's headlines?" }] }],
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        console.log('Response:', response3.text.substring(0, 200) + '...');
    } catch (error) {
        console.log('Error:', error.message);
    }
}

debugSearch();
