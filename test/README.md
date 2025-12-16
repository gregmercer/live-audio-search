# 🧪 Test Files for Gemini Web Search Integration

This folder contains all the test files and examples created during the development of the web search integration for the audio chat.

## 📁 File Overview

### **Core Test Files**
- `gemini-search.ts` - Web search utility classes (for testing and examples)
- `test-search.js` - Basic web search functionality test using GoogleGenAI SDK
- `test-grounding.js` - Tests different grounding configurations and models
- `debug-search.js` - Debug script to troubleshoot grounding issues
- `verify-integration.js` - Comprehensive verification of the audio chat integration

### **Example Implementations**
- `integration-example.ts` - TypeScript example showing smart query detection
- `search-example.ts` - Usage examples for the GeminiWebSearch class
- `working-example.js` - Minimal working example of grounded search

### **Demo Components**
- `enhanced-audio-with-search.tsx` - Alternative audio component with search toggle
- `simple-search-demo.html` - Standalone HTML demo for web search
- `test-audio-integration.html` - Test page for the integrated audio component

### **Utility Files**
- `test-class.js` - Tests the GeminiWebSearch class functionality

## 🚀 How to Run Tests

### **Basic Web Search Test**
```bash
node test/test-search.js
```
Tests the core web search functionality with sample queries.

### **Integration Verification**
```bash
node test/verify-integration.js
```
Verifies that the audio chat integration is working correctly.

### **Debug Grounding Issues**
```bash
node test/debug-search.js
```
Helps troubleshoot if grounding tools aren't working.

### **Test Different Configurations**
```bash
node test/test-grounding.js
```
Tests various model and configuration combinations.

## 🎯 What These Tests Verify

- ✅ API key configuration
- ✅ GoogleGenAI SDK initialization
- ✅ Grounding tools functionality
- ✅ Live session configuration
- ✅ Real-time web search capabilities
- ✅ Audio chat integration

## 📝 Sample Queries Used in Tests

- "Who won the Euro 2024?"
- "What are today's headlines?"
- "What's the weather in San Francisco today?"
- "What are the latest tech news?"

## 🔧 Dependencies

All tests require:
- `@google/genai` package
- `dotenv` for environment variables
- Valid `GEMINI_API_KEY` in `.env.local`

## 🎪 Demo Files

The HTML demo files can be opened directly in a browser or served through the Vite dev server to test the web search functionality in a visual interface.
