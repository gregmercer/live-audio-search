# 📁 Project Structure - Audio Chat with Web Search

## 🎯 **Main Application Files**

```
├── index.tsx                    # Main audio chat component with web search
├── index.html                   # Entry point HTML
├── utils.ts                     # Audio utilities
├── package.json                 # Dependencies and scripts
├── vite.config.ts              # Vite configuration with env vars
└── .env.local                  # Environment variables (GEMINI_API_KEY)
```

## 🧪 **Test Files** (`/test/`)

```
test/
├── README.md                    # Test documentation
├── gemini-search.ts            # Web search utility classes (for testing)
├── test-search.js              # Basic web search test
├── verify-integration.js       # Integration verification
├── debug-search.js             # Debug grounding issues
├── test-grounding.js           # Test different configurations
├── working-example.js          # Minimal working example
├── integration-example.ts      # Smart query detection example
├── search-example.ts           # GeminiWebSearch class usage
├── enhanced-audio-with-search.tsx  # Alternative component
├── simple-search-demo.html     # Standalone web search demo
└── test-audio-integration.html # Audio component test page
```

## 🚀 **Available Scripts**

```bash
# Development
npm run dev                     # Start development server

# Testing
npm run test:search            # Test basic web search
npm run test:integration       # Verify audio chat integration
npm run test:debug            # Debug grounding issues
npm run test:grounding        # Test different configurations

# Build
npm run build                  # Build for production
npm run preview               # Preview production build
```

## 🔧 **Key Features**

### **Main Application** (`index.tsx`)
- ✅ Live audio chat with Gemini 2.0 Flash
- ✅ Real-time transcription
- ✅ Google Search grounding enabled
- ✅ Automatic web search for current events
- ✅ Voice responses with Orus voice

### **Web Search Integration**
- ✅ Grounding tools in live session config
- ✅ Automatic current information access
- ✅ No manual search needed - AI decides when to search
- ✅ Seamless integration with existing audio interface

### **Test Coverage**
- ✅ API key validation
- ✅ SDK initialization
- ✅ Grounding functionality
- ✅ Live session configuration
- ✅ Real-time search capabilities
- ✅ Integration verification

## 🎤 **How to Use**

1. **Start the app**: `npm run dev`
2. **Open**: http://localhost:3003/
3. **Click microphone** and ask questions like:
   - "What are today's headlines?"
   - "What's the weather today?"
   - "Who won the Euro 2024?"

The AI automatically uses web search for current information! 🔍✨
