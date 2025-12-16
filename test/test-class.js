import { GeminiWebSearch } from './gemini-search.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testClass() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }

        console.log('🔍 Testing GeminiWebSearch class...\n');

        const search = new GeminiWebSearch(apiKey);

        console.log('📋 Query: "What are today\'s headlines?"');
        const result = await search.searchWeb("What are today's headlines?");
        console.log('✅ Response:', result);

    } catch (error) {
        console.error('❌ Error testing class:', error.message);
        console.error('Stack:', error.stack);
    }
}

testClass();
