import { useState, useRef, useCallback, useEffect } from 'react';
import { LiveAudioPlayer, floatTo16BitPCM, arrayBufferToBase64 } from '../utils/liveAudioEngine';

export interface LiveTranscriptItem {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
  isCommand?: boolean;
}

export interface ExecutedOrder {
  id: string;
  name: string;
  args: Record<string, unknown>;
  timestamp: string;
  status: 'executed' | 'failed';
}

export interface UseLiveVoiceControlOptions {
  onExecuteCommand?: (name: string, args: Record<string, unknown>) => void;
}

export function useLiveVoiceControl({ onExecuteCommand }: UseLiveVoiceControlOptions = {}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([]);
  const [executedOrders, setExecutedOrders] = useState<ExecutedOrder[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem('mythos_voice') || 'Charon';
  });

  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<LiveAudioPlayer | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const onExecuteCommandRef = useRef(onExecuteCommand);

  useEffect(() => {
    onExecuteCommandRef.current = onExecuteCommand;
  }, [onExecuteCommand]);

  const addTranscript = useCallback((role: 'user' | 'model' | 'system', text: string, isCommand = false) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTranscripts((prev) => [
      ...prev.slice(-49), // retain last 50 entries
      {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        role,
        text,
        timestamp: time,
        isCommand,
      },
    ]);
  }, []);

  const cleanupMic = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    setIsMicActive(false);
    setMicLevel(0);
  }, []);

  const disconnect = useCallback(() => {
    cleanupMic();
    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
  }, [cleanupMic]);

  const startMic = useCallback(async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Input sample rate: 16000 for Gemini Live API
      const inputCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const channelData = e.inputBuffer.getChannelData(0);

        // Calculate simple RMS for visual VU meter
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        setMicLevel(Math.min(1, rms * 5));

        const pcmBuffer = floatTo16BitPCM(channelData);
        const base64 = arrayBufferToBase64(pcmBuffer);
        ws.send(
          JSON.stringify({
            type: 'audio',
            audio: base64,
          })
        );
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
      setIsMicActive(true);
      setErrorMessage(null);
    } catch (err) {
      console.error('Microphone access failed:', err);
      const msg = err instanceof Error ? err.message : 'Microphone access denied or unavailable.';
      setErrorMessage(msg);
      addTranscript('system', `Microphone warning: ${msg}. You can still dispatch orders via text.`);
    }
  }, [addTranscript]);

  const connect = useCallback((voiceOverride?: string) => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const voiceToUse = voiceOverride || selectedVoice;
    setIsConnecting(true);
    setErrorMessage(null);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/live-ws?voice=${encodeURIComponent(voiceToUse)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    if (!playerRef.current) {
      playerRef.current = new LiveAudioPlayer();
    }

    ws.onopen = () => {
      console.log(`[LiveVoice] WebSocket opened with voice: ${voiceToUse}`);
      setIsConnected(true);
      setIsConnecting(false);
      addTranscript('system', `Voice Control Uplink Established. Persona: ${voiceToUse} (gemini-3.1-flash-live-preview).`);
      // Auto-start mic after user clicked connect
      startMic(ws);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'connected') {
          setIsConnected(true);
        }

        if (msg.type === 'command') {
          console.log('[LiveVoice] Command order received:', msg.name, msg.args);
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newOrder: ExecutedOrder = {
            id: msg.id || `${Date.now()}`,
            name: msg.name,
            args: msg.args || {},
            timestamp: time,
            status: 'executed',
          };
          setExecutedOrders((prev) => [newOrder, ...prev.slice(0, 24)]);
          addTranscript('system', `ORDER EXECUTED: ${msg.name}(${JSON.stringify(msg.args)})`, true);
          if (onExecuteCommandRef.current) {
            onExecuteCommandRef.current(msg.name, msg.args);
          }
        }

        if (msg.type === 'audio' && msg.audio) {
          setIsSpeaking(true);
          playerRef.current?.playChunk(msg.audio);
        }

        if (msg.type === 'transcript') {
          addTranscript(msg.role || 'model', msg.text);
        }

        if (msg.type === 'interrupted') {
          playerRef.current?.interrupt();
          setIsSpeaking(false);
        }

        if (msg.type === 'error') {
          setErrorMessage(msg.error);
          addTranscript('system', `Live API Error: ${msg.error}`);
        }
      } catch (err) {
        console.error('[LiveVoice] Message parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[LiveVoice] WebSocket error:', err);
      setErrorMessage('Uplink connection error.');
      setIsConnecting(false);
    };

    ws.onclose = () => {
      console.log('[LiveVoice] WebSocket closed');
      setIsConnected(false);
      setIsConnecting(false);
      setIsSpeaking(false);
      cleanupMic();
      addTranscript('system', 'Voice Control Uplink Offline.');
    };
  }, [addTranscript, cleanupMic, startMic]);

  const toggleMic = useCallback(async () => {
    if (isMicActive) {
      cleanupMic();
      addTranscript('system', 'Microphone muted.');
    } else {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        await startMic(wsRef.current);
        addTranscript('system', 'Microphone active.');
      }
    }
  }, [isMicActive, cleanupMic, startMic, addTranscript]);

  const sendOrderText = useCallback(
    (text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setErrorMessage('Voice control uplink is not connected. Connect first.');
        return;
      }
      addTranscript('user', text);
      wsRef.current.send(
        JSON.stringify({
          type: 'text',
          text,
        })
      );
    },
    [addTranscript]
  );

  const changeVoice = useCallback(
    (voice: string) => {
      setSelectedVoice(voice);
      try {
        localStorage.setItem('mythos_voice', voice);
      } catch (err) {
        console.warn('Unable to persist voice preference:', err);
      }
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        disconnect();
        setTimeout(() => {
          connect(voice);
        }, 200);
      }
    },
    [disconnect, connect]
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    isMicActive,
    isSpeaking,
    micLevel,
    transcripts,
    executedOrders,
    errorMessage,
    selectedVoice,
    changeVoice,
    connect,
    disconnect,
    toggleMic,
    sendOrderText,
  };
}

export type LiveVoiceControlHandle = ReturnType<typeof useLiveVoiceControl>;
