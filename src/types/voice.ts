export interface GeminiVoiceInfo {
  name: string;
  gender: string;
  tone: string;
  category: string;
  default?: boolean;
  description: string;
}

export interface ModelPersonaProfile {
  id: string;
  name: string;
  defaultTemp: number;
  description: string;
}

export interface VoiceParameterState {
  geminiVoice: string;
  persona: string;
  temperature: number;
  speechRate: number;
  speechPitch: number;
  windowsVoiceName: string;
}

export interface VoiceParameterPreset {
  id: string;
  title: string;
  geminiVoice: string;
  persona: string;
  temperature: number;
  speechRate: number;
  speechPitch: number;
  badge: string;
  description: string;
}

export type AudioRoutingMode = 'auto' | 'gemini-only' | 'sapi-only';

