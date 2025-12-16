# 🎤 Live Audio Chat with Web Search

A real-time audio chat interface powered by **Gemini 2.0 Flash** with **automatic web search capabilities**. Ask questions about current events, weather, news, or anything - the AI automatically searches the web when needed and responds with up-to-date information.

## ✨ Features

- 🎤 **Live Audio Chat** - Real-time voice conversation with AI
- 🔍 **Automatic Web Search** - AI automatically searches Google for current information
- 📰 **Current Events** - Get today's headlines and breaking news
- 🌤️ **Weather Updates** - Real-time weather conditions anywhere
- 📈 **Stock Information** - Current market data and prices
- ⚽ **Sports Results** - Latest scores and game results
- 🎯 **Smart Detection** - AI knows when to search vs. use general knowledge
- 🔊 **Natural Voice** - High-quality audio responses with Orus voice

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Gemini API Key** ([Get one here](https://ai.google.dev/))

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd live-audio-transcript
   npm install
   ```

2. **Set up your API key:**
   ```bash
   # Add your Gemini API key to .env.local
   echo "GEMINI_API_KEY=your_api_key_here" > .env.local
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:3003
   ```

5. **Start talking!** 🎤
   - Click the microphone button
   - Ask questions like "What are today's headlines?"
   - The AI will automatically search the web and respond

## 📁 Project Structure

```
live-audio-transcript/
├── 📄 index.tsx                # Main audio chat component
├── 📄 index.html               # Application entry point
├── 📄 utils.ts                 # Audio processing utilities
├── 📄 index.css                # Application styles
├── 📄 vite.config.ts           # Vite build configuration
├── 📄 tsconfig.json            # TypeScript configuration
├── 📄 package.json             # Dependencies and scripts
├── 📄 .env.local               # Environment variables (API key)
├── 📁 public/                  # Static assets
├── 📁 test/                    # Test files and examples
│   ├── 📄 gemini-search.ts     # Web search utilities (for testing)
│   ├── 📄 test-search.js       # Basic functionality tests
│   ├── 📄 verify-integration.js # Integration verification
│   ├── 📄 enhanced-audio-with-search.tsx # Alternative component
│   └── 📄 README.md            # Test documentation
└── 📁 docs/                    # Project documentation
```

### 📄 File Descriptions

#### **Core Application Files**

- **`index.tsx`** - The main React component that handles:
  - Live audio recording and playback
  - Real-time transcription
  - Web search integration via Gemini grounding tools
  - Audio session management

- **`index.html`** - HTML entry point that loads the audio component

- **`utils.ts`** - Audio processing utilities:
  - Audio encoding/decoding functions
  - Blob creation for audio data
  - Audio buffer management

- **`vite.config.ts`** - Build configuration:
  - Environment variable exposure
  - Development server settings
  - Build optimization

#### **Configuration Files**

- **`.env.local`** - Environment variables (your Gemini API key)
- **`tsconfig.json`** - TypeScript compiler configuration
- **`package.json`** - Project dependencies and npm scripts

#### **Test & Development Files**

- **`test/gemini-search.ts`** - Standalone web search utilities for testing
- **`test/verify-integration.js`** - Verifies the web search integration works
- **`test/enhanced-audio-with-search.tsx`** - Alternative component with search toggle

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server (port 3003)
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm run test:search     # Test basic web search functionality
npm run test:integration # Verify audio chat integration
npm run test:debug      # Debug grounding issues
npm run test:grounding  # Test different configurations
```

## 🎯 How It Works

### **The Magic Behind the Scenes**

1. **You speak** → Microphone captures your voice
2. **Live session** → Audio sent to Gemini 2.0 Flash in real-time
3. **AI analysis** → Gemini determines if web search is needed
4. **Auto search** → If needed, Google Search is triggered automatically
5. **Smart response** → AI combines search results with its knowledge
6. **Audio output** → You hear the response with current information

### **Web Search Integration**

The web search is built into the live audio session configuration:

```typescript
config: {
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } }
  },
  inputAudioTranscription: {},
  outputAudioTranscription: {},
  tools: [{
    googleSearch: {}  // ← This enables automatic web search!
  }]
}
```

### **Smart Query Detection**

The AI automatically knows when to search:

**✅ Uses Web Search:**
- "What are today's headlines?"
- "What's the weather in New York?"
- "Who won the Euro 2024?"
- "What's Apple's current stock price?"

**❌ Uses General Knowledge:**
- "How do I cook pasta?"
- "Explain quantum physics"
- "Tell me a joke"

## 🔧 Technical Details

### **Technologies Used**
- **Frontend:** TypeScript, Lit Elements, Vite
- **AI:** Google Gemini 2.0 Flash with live audio
- **Web Search:** Google Search grounding tools
- **Audio:** Web Audio API, real-time processing

### **Key Dependencies**
- `@google/genai` - Gemini AI SDK
- `lit` - Web components framework
- `vite` - Build tool and dev server

### **Browser Requirements**
- Modern browser with Web Audio API support
- Microphone access permission
- HTTPS (required for microphone in production)

## 🎤 Usage Examples

### **Current Events**
> "What are the top news stories today?"

*AI searches Google and provides current headlines*

### **Weather**
> "What's the weather like in San Francisco right now?"

*AI gets real-time weather data*

### **Sports**
> "Did the Lakers win their last game?"

*AI searches for recent game results*

### **General Questions**
> "How does photosynthesis work?"

*AI uses general knowledge (no web search needed)*

## 🚀 Deployment

### **Build for Production**
```bash
npm run build
```

### **Deploy to Vercel/Netlify**
1. Connect your repository
2. Set `GEMINI_API_KEY` environment variable
3. Deploy!

### **Environment Variables**
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

## 🧪 Testing

Run the test suite to verify everything works:

```bash
# Verify the integration
npm run test:integration

# Test basic search functionality
npm run test:search

# Debug any issues
npm run test:debug
```

## 📝 License

This project is licensed under the Apache 2.0 License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🆘 Troubleshooting

### **Common Issues**

**"I am unable to access the internet"**
- Ensure `tools: [{ googleSearch: {} }]` is in your session config
- Check your API key is valid
- Verify you're using a supported model

**No audio output**
- Check browser microphone permissions
- Ensure HTTPS in production
- Verify Web Audio API support

**Build errors**
- Run `npm install` to ensure dependencies
- Check Node.js version (v18+ required)
- Verify TypeScript configuration

### **Getting Help**

1. Check the test files in `/test/` for examples
2. Run `npm run test:debug` to diagnose issues
3. Review the console for error messages

---

**Ready to chat with AI about anything? Start the app and ask away!** 🎤✨
