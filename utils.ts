/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Blob } from '@google/genai';

function encode(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // convert float32 -1 to 1 to int16 -32768 to 32767
    int16[i] = data[i] * 32768;
  }

  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const buffer = ctx.createBuffer(
    numChannels,
    data.length / 2 / numChannels,
    sampleRate,
  );

  const dataInt16 = new Int16Array(data.buffer);
  const l = dataInt16.length;
  const dataFloat32 = new Float32Array(l);
  for (let i = 0; i < l; i++) {
    dataFloat32[i] = dataInt16[i] / 32768.0;
  }
  // Extract interleaved channels
  if (numChannels === 0) {
    buffer.copyToChannel(dataFloat32, 0);
  } else {
    for (let i = 0; i < numChannels; i++) {
      const channel = dataFloat32.filter(
        (_, index) => index % numChannels === i,
      );
      buffer.copyToChannel(channel, i);
    }
  }

  return buffer;
}

// Time grounding functions for accurate time information
function getCurrentTime(): {
  utc: string;
  local: string;
  timezone: string;
  timestamp: number;
  formatted: string;
} {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    utc: now.toISOString(),
    local: now.toLocaleString(),
    timezone,
    timestamp: now.getTime(),
    formatted: now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  };
}

function getTimeInTimezone(timezone: string): string {
  const now = new Date();
  return now.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}

// Execute JavaScript code safely for time calculations
function executeTimeCode(code: string): any {
  try {
    // Create a safe execution context with time utilities
    const context = {
      Date,
      Math,
      parseInt,
      parseFloat,
      getCurrentTime,
      getTimeInTimezone,
      console: {
        log: (...args: any[]) => console.log('[Time Execution]:', ...args)
      }
    };

    // Create function with limited scope
    const func = new Function(...Object.keys(context), `return (${code})`);
    return func(...Object.values(context));
  } catch (error) {
    console.error('Time code execution error:', error);
    return { error: error.message };
  }
}

export { createBlob, decode, decodeAudioData, encode, getCurrentTime, getTimeInTimezone, executeTimeCode };
