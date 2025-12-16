/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { LitElement, css, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { createBlob, decode, decodeAudioData } from './utils';

interface LogEntry {
  source: 'user' | 'model';
  text: string;
  mapData?: {
    location: string;
    lat?: number;
    lng?: number;
    zoom?: number;
  };
}

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() status = 'Initialized';
  @state() error = '';
  @state() logs: LogEntry[] = [];

  @query('.log-container') private logContainer: HTMLElement | undefined;

  private client: GoogleGenAI;
  private session: Session | null = null;
  // Fix: Cast window to any to access webkitAudioContext
  private inputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({ sampleRate: 16000 });
  // Fix: Cast window to any to access webkitAudioContext
  private outputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({ sampleRate: 24000 });
  private inputNode = this.inputAudioContext.createGain();
  private outputNode = this.outputAudioContext.createGain();
  private nextStartTime = 0;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null;
  private sources = new Set<AudioBufferSourceNode>();

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background: #121212;
      color: #e0e0e0;
      font-family: 'Roboto', sans-serif;
      overflow: hidden;
    }

    .header {
      padding: 16px;
      text-align: center;
      background: #1e1e1e;
      border-bottom: 1px solid #333;
      font-size: 1rem;
      font-weight: 500;
      color: #888;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .log-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
    }

    .log-entry {
      padding: 12px 18px;
      border-radius: 18px;
      max-width: 80%;
      line-height: 1.5;
      word-wrap: break-word;
      animation: fadeIn 0.3s ease;
      font-size: 1.1rem;
    }

    .log-entry.model {
      max-width: 90%;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .user {
      align-self: flex-end;
      background: #4a90e2;
      color: white;
      border-bottom-right-radius: 4px;
    }

    .model {
      align-self: flex-start;
      background: #2c2c2c;
      color: #e0e0e0;
      border-bottom-left-radius: 4px;
    }

    .map-container {
      margin-top: 12px;
      border-radius: 8px;
      overflow: hidden;
      height: 600px;
      min-width: 50vw;
      width: 100%;
      background: #1a1a1a;
      border: 1px solid #444;
    }

    .map-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .controls {
      padding: 24px;
      background: #1e1e1e;
      border-top: 1px solid #333;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
    }

    button {
      outline: none;
      border: none;
      border-radius: 50%;
      width: 64px;
      height: 64px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .start-btn {
      background: #ef4444;
      color: white;
    }
    .start-btn:hover:not(:disabled) {
      background: #dc2626;
      transform: scale(1.05);
    }

    .stop-btn {
      background: #333;
      color: white;
    }
    .stop-btn:hover:not(:disabled) {
      background: #444;
    }

    .status-text {
        font-size: 0.8rem;
    }

    .error-text {
        color: #ff6b6b;
        font-size: 0.8rem;
    }
  `;

  constructor() {
    super();
    this.initClient();
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('logs')) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    if (this.logContainer) {
      setTimeout(() => {
        this.logContainer!.scrollTop = this.logContainer!.scrollHeight;
      }, 0);
    }
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initClient() {
    this.initAudio();
    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    this.outputNode.connect(this.outputAudioContext.destination);

    this.connectSession();
  }

  private async connectSession() {
    const model = 'gemini-2.5-flash-native-audio-preview-09-2025';

    try {
      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            this.updateStatus('Connected');
            this.addLog('model', 'Hello! I can help with current events, weather, news, maps, and more. I have access to real-time information and can show you interactive maps when you ask about locations.');
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData;
            if (audio) {
              this.nextStartTime = Math.max(
                this.nextStartTime,
                this.outputAudioContext.currentTime,
              );
              const audioBuffer = await decodeAudioData(
                decode(audio.data),
                this.outputAudioContext,
                24000,
                1,
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputNode);
              source.addEventListener('ended', () => {
                this.sources.delete(source);
              });
              source.start(this.nextStartTime);
              this.nextStartTime = this.nextStartTime + audioBuffer.duration;
              this.sources.add(source);
            }

            // Handle Transcription
            const inputTrans = message.serverContent?.inputTranscription;
            if (inputTrans) {
              this.updateLastLog('user', inputTrans.text);
            }

            const outputTrans = message.serverContent?.outputTranscription;
            if (outputTrans) {
              this.updateLastLog('model', outputTrans.text);

              // Only check for locations when we have a complete sentence and no map data yet
              const lastLog = this.logs[this.logs.length - 1];
              if (lastLog && lastLog.source === 'model' && !lastLog.mapData &&
                (lastLog.text.endsWith('.') || lastLog.text.endsWith('!') || lastLog.text.endsWith('?'))) {

                // Wait a bit to ensure we have the complete response
                setTimeout(async () => {
                  const currentLastLog = this.logs[this.logs.length - 1];
                  if (currentLastLog && !currentLastLog.mapData) {
                    const mapData = await this.extractMapData(currentLastLog.text);
                    if (mapData) {
                      const updatedLogs = [...this.logs];
                      updatedLogs[updatedLogs.length - 1] = {
                        ...currentLastLog,
                        mapData: mapData
                      };
                      this.logs = updatedLogs;
                    }
                  }
                }, 500); // Wait 500ms for response to complete
              }
            }

            // Handle Interruptions
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of this.sources.values()) {
                source.stop();
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            this.updateError(e.message);
          },
          onclose: (e: CloseEvent) => {
            this.updateStatus('Disconnected');
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
            parts: [{
              text: "You are an AI assistant with access to Google Search, Google Maps, and code execution. When users ask about locations, ALWAYS include the complete, specific location name in your response. Use formats like: 'Stanford University is located in Stanford, California' or 'The Eiffel Tower is located in Paris, France' or 'Times Square is located in New York City, New York'. Always mention the full place name and city/state/country so maps can be displayed automatically."
            }]
          },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{
            googleSearch: {}
          }, {
            codeExecution: {}
          }, {
            googleMaps: {}
          }]
        },
      });
    } catch (e: any) {
      console.error(e);
      this.updateError(e.message || 'Connection failed');
    }
  }

  private addLog(source: 'user' | 'model', text: string) {
    this.logs = [...this.logs, { source, text }];
  }

  private addLogWithMap(source: 'user' | 'model', text: string, mapData: any) {
    this.logs = [...this.logs, { source, text, mapData }];
  }

  private async extractMapData(text: string): Promise<any> {
    console.log('Extracting map data from:', text);

    // First try AI-powered coordinate extraction
    const aiCoords = await this.getCoordinatesFromAI(text);
    if (aiCoords) {
      return aiCoords;
    }

    // More specific and accurate location patterns (ordered by specificity)
    const locationPatterns = [
      // Famous landmarks and parks (most specific first)
      /(Golden Gate Park|Golden Gate Bridge|Eiffel Tower|Statue of Liberty|Times Square|Central Park|Hollywood Sign|Space Needle|Empire State Building|Big Ben|Tower Bridge|Sydney Opera House)/i,

      // Stanford specific patterns (most specific first)
      /(Stanford Graduate School of Business|Stanford GSB|Stanford University|Stanford Business School)/i,

      // Other universities with full names
      /(Harvard University|MIT|University of California|Yale University|Princeton University|Columbia University)/i,

      // General university/school patterns
      /([A-Z][a-zA-Z\s]+(?:University|College|Graduate School|Business School|School of Business))/i,

      // City, State/Country patterns (less specific - moved to end)
      /(?:in|at|located in|near)\s+([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/i,

      // Specific addresses or places
      /(?:located at|address is|situated at)\s+([^.!?]+)/i,

      // Campus/University patterns
      /([A-Z][a-zA-Z\s]+\s+(?:University|College|Campus|School))/i,

      // General city/place names
      /(?:in|at|near)\s+([A-Z][a-zA-Z\s]{3,25})/i,
    ];

    for (let i = 0; i < locationPatterns.length; i++) {
      const pattern = locationPatterns[i];
      const match = text.match(pattern);
      if (match && match[1]) {
        let location = match[1].trim();

        // Clean up the location string
        location = location.replace(/[.!?]+$/, ''); // Remove trailing punctuation
        location = location.replace(/\s+/g, ' '); // Normalize spaces

        // Filter out very short, generic, or invalid matches
        const invalidWords = /^(the|and|or|but|with|for|from|this|that|it|is|are|was|were|a|an)$/i;
        if (location.length > 2 && !invalidWords.test(location)) {
          console.log(`Pattern ${i} matched:`, location);

          // Set appropriate zoom level based on location type
          let zoom = 15; // default
          let zoomReason = 'default';

          if (location.match(/University|College|Campus|Graduate School|Business School|School of Business|GSB/i)) {
            zoom = 17; // Close zoom for campuses
            zoomReason = 'campus/university';
          } else if (location.match(/Park|Garden|Bridge|Tower|Building|Museum|Library/i)) {
            zoom = 16; // Medium-close zoom for landmarks
            zoomReason = 'landmark/park';
          } else if (location.match(/City|Town|Village/i)) {
            zoom = 13; // Wider zoom for cities
            zoomReason = 'city/town';
          } else if (location.match(/,/)) {
            // City, State format - medium zoom
            zoom = 14;
            zoomReason = 'city, state';
          }

          console.log(`🗺️ Location: "${location}" | Zoom: ${zoom} (${zoomReason})`);

          return {
            location: location,
            zoom: zoom
          };
        }
      }
    }

    // Check for coordinate patterns
    const coordPattern = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
    const coordMatch = text.match(coordPattern);
    if (coordMatch) {
      const location = `${coordMatch[1]}, ${coordMatch[2]}`;
      console.log('Coordinate match:', location);
      return {
        location: location,
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2]),
        zoom: 16 // Closer zoom for specific coordinates
      };
    }

    console.log('No location match found');
    return null;
  }

  private async getCoordinatesFromAI(text: string): Promise<any> {
    try {

      const prompt = `Extract location information from this text and return ONLY a JSON object with the following format:
{
  "location": "specific place name",
  "lat": latitude_number,
  "lng": longitude_number,
  "zoom": zoom_level_number
}

Rules:
- If no specific location is mentioned, return null
- Use zoom 17 for universities/campuses/schools
- Use zoom 16 for landmarks/parks/buildings
- Use zoom 14 for cities
- Use zoom 15 for other locations
- Return the most specific location mentioned

Text: "${text}"`;

      // Use fetch to call Gemini API directly
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      // Clean up the response - remove markdown code blocks if present
      if (aiResponse) {
        // Remove ```json and ``` markers
        aiResponse = aiResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        // Remove any leading/trailing whitespace
        aiResponse = aiResponse.trim();
        console.log('🧹 Cleaned AI response:', aiResponse);
      }

      // Try to parse the JSON response
      if (aiResponse && aiResponse !== 'null') {
        const parsed = JSON.parse(aiResponse);
        if (parsed && parsed.location && parsed.lat && parsed.lng) {
          console.log('🤖 AI extracted coordinates:', parsed);
          return parsed;
        }
      }
    } catch (error) {
      console.log('AI coordinate extraction failed:', error);
    }

    return null;
  }

  private updateLastLog(source: 'user' | 'model', text: string) {
    if (!text) return;

    const lastLog = this.logs[this.logs.length - 1];

    if (lastLog && lastLog.source === source) {
      const updatedLogs = [...this.logs];
      updatedLogs[updatedLogs.length - 1] = {
        ...lastLog,
        text: lastLog.text + text
      };
      this.logs = updatedLogs;
    } else {
      this.addLog(source, text);
    }
  }

  private updateLastLogWithMap(source: 'user' | 'model', text: string, mapData: any) {
    if (!text) return;

    const lastLog = this.logs[this.logs.length - 1];

    if (lastLog && lastLog.source === source) {
      const updatedLogs = [...this.logs];
      updatedLogs[updatedLogs.length - 1] = {
        ...lastLog,
        text: lastLog.text + text,
        mapData: mapData
      };
      this.logs = updatedLogs;
    } else {
      this.addLogWithMap(source, text, mapData);
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
    this.error = '';
  }

  private updateError(msg: string) {
    this.error = msg;
  }

  private async startRecording() {
    if (this.isRecording) return;
    if (!this.session) {
      await this.connectSession();
    }

    this.inputAudioContext.resume();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 4096;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) return;
        if (!this.session) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);

        this.session.sendRealtimeInput({ media: createBlob(pcmData) });
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);

      this.isRecording = true;
      this.updateStatus('Listening...');
    } catch (err: any) {
      console.error('Error starting recording:', err);
      this.updateError(`Error: ${err.message}`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording) return;

    this.isRecording = false;
    this.updateStatus('Paused');

    if (this.scriptProcessorNode && this.sourceNode) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  private async reset() {
    this.stopRecording();
    if (this.session) {
      try {
        (this.session as any).close();
      } catch (e) {
        console.log("Session close error", e);
      }
    }
    this.logs = [];
    this.session = null;
    await this.connectSession();
  }

  render() {
    return html`
      <div class="header">
        <div>Audio Chat with Web Search 🔍</div>
        <div>
            <span class="status-text">${this.status}</span>
            <span class="error-text">${this.error}</span>
        </div>
      </div>

      <div class="log-container">
        ${this.logs.map(log => html`
          <div class="log-entry ${log.source}">
            ${log.text}
            ${log.mapData ? html`
              <div class="map-container">
                <iframe
                  class="map-iframe"
                  src="https://www.google.com/maps/embed/v1/place?key=${process.env.GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(log.mapData.location)}&zoom=${log.mapData.zoom || 15}"
                  allowfullscreen>
                </iframe>
              </div>
            ` : ''}
          </div>
        `)}
      </div>

      <div class="controls">
        <button
          class="stop-btn"
          @click=${this.reset}
          title="Reset Session">
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
            <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
          </svg>
        </button>

        ${!this.isRecording ? html`
            <button
              class="start-btn"
              @click=${this.startRecording}
              title="Start Recording">
              <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="currentColor">
                <path d="M480-280q-75 0-127.5-52.5T300-460q0-75 52.5-127.5T480-640q75 0 127.5 52.5T660-460q0 75-52.5 127.5T480-280Zm0-80q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Z"/>
                <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z"/>
              </svg>
            </button>
        ` : html`
             <button
              class="start-btn"
              style="background-color: #333;"
              @click=${this.stopRecording}
              title="Stop Recording">
              <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#ef4444">
                 <path d="M320-320h320v-320H320v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/>
              </svg>
            </button>
        `}
      </div>
    `;
  }
}
