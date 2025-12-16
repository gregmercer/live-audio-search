import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGrounding() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }

        console.log('🔍 Testing different grounding configurations...\n');

        const ai = new GoogleGenAI({ apiKey });

        // Try different model versions and configurations
        const models = [
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-1.5-pro"
        ];

        const configurations = [
            // Configuration 1: Basic googleSearch
            {
                name: "Basic googleSearch",
                tools: [{ googleSearch: {} }]
            },
            // Configuration 2: With grounding
            {
                name: "With grounding",
                tools: [{
                    googleSearch: {
                        dynamicRetrievalConfig: {
                            mode: "MODE_DYNAMIC",
                            dynamicThreshold: 0.7
                        }
                    }
                }]
            },
            // Configuration 3: Simple grounding
            {
                name: "Simple grounding",
                tools: [{
                    grounding: {
                        googleSearch: {}
                    }
                }]
            }
        ];

        for (const model of models) {
            console.log(`\n🤖 Testing model: ${model}`);

            for (const config of configurations) {
                console.log(`\n📋 Configuration: ${config.name}`);
                console.log('Query: "What are today\'s headlines?"');

                try {
                    const response = await ai.models.generateContent({
                        model: model,
                        contents: "What are today's headlines?",
                        config: {
                            tools: config.tools
                        }
                    });

                    console.log('✅ Response:', response.text.substring(0, 200) + '...');

                    // If this works, we found the right configuration
                    if (!response.text.includes("unable to access the internet")) {
                        console.log(`\n🎉 SUCCESS! Working configuration found:`);
                        console.log(`Model: ${model}`);
                        console.log(`Config:`, JSON.stringify(config, null, 2));
                        return;
                    }
                } catch (error) {
                    console.log('❌ Error:', error.message);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error testing grounding:', error.message);
    }
}

testGrounding();
