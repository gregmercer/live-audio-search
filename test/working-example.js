import { GoogleGenAI } from "@google/genai";

// WORKING EXAMPLE - Copy this exact pattern
async function workingWebSearch() {
    // Replace with your API key
    const apiKey = "AIzaSyCKvaDDiYKmbzaSWsQI1wtqAKGchFeUbwQ";

    const ai = new GoogleGenAI({ apiKey });

    // This is the EXACT configuration that works
    const groundingTool = {
        googleSearch: {},
    };

    const config = {
        tools: [groundingTool],
    };

    // Make the request
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: "What are today's headlines?",
        config,
    });

    console.log("✅ SUCCESS:", response.text);
    return response.text;
}

// Test it
workingWebSearch().catch(console.error);
