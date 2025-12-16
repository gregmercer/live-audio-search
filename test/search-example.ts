import { initializeGeminiSearch } from './gemini-search.js';

async function demonstrateWebSearch() {
    try {
        const geminiSearch = await initializeGeminiSearch();

        // Example queries using the new SDK approach
        console.log('=== Euro 2024 Winner ===');
        const euroResult = await geminiSearch.searchWeb('Who won the Euro 2024?');
        console.log(euroResult);

        console.log('\n=== Current Events ===');
        const currentEvents = await geminiSearch.getCurrentEvents();
        console.log(currentEvents);

        console.log('\n=== Weather Example ===');
        const weather = await geminiSearch.getWeather('New York');
        console.log(weather);

        console.log('\n=== Stock Information ===');
        const stockInfo = await geminiSearch.getStockInfo('AAPL');
        console.log(stockInfo);

    } catch (error) {
        console.error('Search demonstration failed:', error);
    }
}

// Run the demonstration
demonstrateWebSearch();
