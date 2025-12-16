/* tslint:disable */
/**
 * Enhanced Audio Component with Web Search Integration
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { LitElement, css, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { createBlob, decode, decodeAudioData } from './utils';
import { GeminiWebSearch } from './gemini-search.js';

interface LogEntry {
  source: 'user' | 'model' | 'search';
  text: string;
  timestamp?: Date;
}

@customElement('enhanced-audio-search')
export class EnhancedAudioWithSearch extends LitElement {
  @state() isRecording = false;
  @state() status = 'Initialized';
  @state() error = '';
  @state() logs: LogEntry[] = [];
  @state() searchMode = false;

  @query('.log-container') private logContainer: HTMLElement | undefined;
  @query('.search-input') private searchInput: HTMLInputElement | undefined;

  private client: GoogleGenAI;
  private webSearch: GeminiWebSearch | null = null;
  private session: Session | null = null;
  private inputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({ sampleRate: 16000 });
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

    .mode-toggle {
      background: #4a90e2;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;
    }

    .mode-toggle:hover {
      background: #357abd;
    }

    .search-container {
      padding: 16px;
      background: #1e1e1e;
      border-bottom: 1px solid #333;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .search-input {
      flex: 1;
      padding: 12px;
      border: 1px solid #444;
      border-radius: 8px;
      background: #2c2c2c;
      color: #e0e0e0;
      font-size: 1rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #4a90e2;
    }

    .search-btn {
      padding: 12px 20px;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.2s;
    }

    .search-btn:hover {
      background: #357abd;
    }

    .search-btn:disabled {
      background: #666;
      cursor: not-allowed;
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
      position: relative;
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

    .search {
      align-self: flex-start;
      background: #2d5a2d;
      color: #e0e0e0;
      border-bottom-left-radius: 4px;
      border-left: 4px solid #4caf50;
    }

    .timestamp {
      font-size: 0.8rem;
      opacity: 0.7;
      margin-top: 4px;
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

    .hidden {
      display: none;
    }
  `;

  constructor() {
    super();
    this.initClient();
    this.initWebSearch();
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

  private async initWebSearch() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        this.webSearch = new GeminiWebSearch(apiKey);
      }
    } catch (error) {
      console.error('Failed to initialize web search:', error);
    }
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initClient() {
    this.initAudio();
    this.client = new GoogleGenAI({
      apiKey: process.env.API_KEY,
    });
    this.outputNode.connect(this.outputAudioContext.destination);

    if (!this.searchMode) {
      this.connectSession();
    }
  }

  private async connectSession() {
    const model = 'gemini-2.5-flash-native-audio-preview-09-2025';

    try {
      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            this.updateStatus('Connected');
            this.addLog('model', 'Hello! I am listening. You can also switch to search mode for current events.');
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
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
      });
    } catch (e: any) {
      console.error(e);
      this.updateError(e.message || 'Connection failed');
    }
  }

  private addLog(source: 'user' | 'model' | 'search', text: string) {
    this.logs = [...this.logs, { source, text, timestamp: new Date() }];
  }

  private updateLastLog(source: 'user' | 'model' | 'search', text: string) {
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

  private updateStatus(msg: string) {
    this.status = msg;
    this.error = '';
  }

  private updateError(msg: string) {
    this.error = msg;
  }

  private toggleMode() {
    this.searchMode = !this.searchMode;

    if (this.searchMode) {
      this.stopRecording();
      this.updateStatus('Search Mode');
    } else {
      this.updateStatus('Audio Mode');
      this.connectSession();
    }
  }

  private async performSearch() {
    if (!this.webSearch || !this.searchInput) return;

    const query = this.searchInput.value.trim();
    if (!query) return;

    this.addLog('user', query);
    this.updateStatus('Searching...');

    try {
      const result = await this.webSearch.searchWeb(query);
      this.addLog('search', result);
      this.updateStatus('Search Complete');
      this.searchInput.value = '';
    } catch (error) {
      this.updateError(`Search failed: ${error}`);
    }
  }

  private handleSearchKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.performSearch();
    }
  }

  private async startRecording() {
    if (this.isRecording || this.searchMode) return;
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
    this.updateStatus(this.searchMode ? 'Search Mode' : 'Paused');

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
    if (!this.searchMode) {
      await this.connectSession();
    }
  }

  render() {
    return html`
      <div class="header">
        <div>Enhanced Audio Chat with Web Search</div>
        <div>
          <button class="mode-toggle" @click=${this.toggleMode}>
            ${this.searchMode ? 'Switch to Audio' : 'Switch to Search'}
          </button>
        </div>
        <div>
            <span class="status-text">${this.status}</span>
            <span class="error-text">${this.error}</span>
        </div>
      </div>

      <div class="search-container ${this.searchMode ? '' : 'hidden'}">
        <input
          class="search-input"
          type="text"
          placeholder="Ask about current events, weather, news..."
          @keypress=${this.handleSearchKeyPress}
        />
        <button class="search-btn" @click=${this.performSearch}>
          Search
        </button>
      </div>

      <div class="log-container">
        ${this.logs.map(log => html`
          <div class="log-entry ${log.source}">
            ${log.text}
            ${log.timestamp ? html`
              <div class="timestamp">
                ${log.timestamp.toLocaleTimeString()}
              </div>
            ` : ''}
          </div>
        `)}
      </div>

      <div class="controls ${this.searchMode ? 'hidden' : ''}">
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
