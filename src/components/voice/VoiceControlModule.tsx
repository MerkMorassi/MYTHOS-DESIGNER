import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Terminal,
  Cpu,
  Power,
  Zap,
  HardDrive,
  FolderOpen,
  Network,
  Play,
} from 'lucide-react';
import { ThemeId } from '../../types/msd';
import { THEMES } from '../../constants/themes';
import { LiveVoiceControlHandle } from '../../hooks/useLiveVoiceControl';

interface VoiceControlModuleProps {
  currentTheme: ThemeId;
  onExecuteCommand: (name: string, args: Record<string, unknown>) => void;
  activeMode: string;
  anomalySimulated: boolean;
  voiceControl: LiveVoiceControlHandle;
}

export const VoiceControlModule: React.FC<VoiceControlModuleProps> = ({
  currentTheme,
  onExecuteCommand: _onExecuteCommand,
  activeMode,
  anomalySimulated,
  voiceControl,
}) => {
  const theme = THEMES[currentTheme] || THEMES['noir-dark'];
  const [customPrompt, setCustomPrompt] = useState('');

  const {
    isConnected,
    isConnecting,
    isMicActive,
    isSpeaking,
    micLevel,
    transcripts,
    executedOrders,
    errorMessage,
    selectedVoice,
    isTtsFallbackActive,
    fallbackVoiceName,
    changeVoice,
    connect,
    disconnect,
    toggleMic,
    sendOrderText,
    testWindowsVoice,
  } = voiceControl;

  const handleSendCustomPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    sendOrderText(customPrompt.trim());
    setCustomPrompt('');
  };

  // Quick Tactical Order Presets
  const quickOrders = [
    { label: 'Switch to MSD View', prompt: 'Computer, switch mode to MSD view.' },
    { label: 'Load Image from Z: Drive', prompt: 'Computer, load image from the Z drive folder Z:/missions/sector4/image.png' },
    { label: 'Load Host Schematic', prompt: 'Computer, load image from /scans/core_lattice.png' },
    { label: 'Run Python Telemetry', prompt: 'Computer, execute Python script ingest_telemetry.py' },
    { label: 'Query Network Daemon', prompt: 'Computer, query network cluster node 127.0.0.1 on port 8000.' },
    { label: 'Switch to AI Diagnostics', prompt: 'Computer, switch mode to AI diagnostics.' },
    { label: 'Switch to UI Builder', prompt: 'Computer, switch mode to UI builder.' },
    { label: 'Theme: Noir Dark', prompt: 'Switch theme to noir-dark.' },
    { label: 'Theme: Aegis Amber', prompt: 'Switch theme to aegis-amber.' },
    { label: 'Theme: Quantum Cyan', prompt: 'Switch theme to quantum-cyan.' },
    { label: 'Trigger Anomaly Surge', prompt: 'Trigger emergency anomaly surge and test alert systems.' },
    { label: 'Reset System to Nominal', prompt: 'Clear all alarms and reset anomaly simulation to nominal.' },
    { label: 'Schematic: Neural Lattice', prompt: 'Select the neural lattice schematic.' },
    { label: 'Schematic: Quantum Core', prompt: 'Select the quantum core schematic.' },
    { label: 'Inspect Plasma Subsystem', prompt: 'Focus on and inspect the plasma subsystem node.' },
    { label: 'Recalibrate Telemetry', prompt: 'Recalibrate system metrics and purge microstate entropy.' },
    { label: 'Voice: Charon (Tactical)', prompt: 'Computer, switch voice persona to Charon.' },
    { label: 'Voice: Kore (Articulate)', prompt: 'Computer, switch voice persona to Kore.' },
    { label: 'Voice: Zephyr (Smooth)', prompt: 'Computer, switch voice persona to Zephyr.' },
  ];

  return (
    <div
      id="voice-control-module"
      className="flex flex-col gap-3 w-full h-full text-slate-300 font-mono text-sm select-none"
    >
      {/* Top Uplink Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md border"
        style={{
          backgroundColor: theme.colors.bgSlate,
          borderColor: theme.colors.border,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded border flex items-center justify-center transition-colors ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400'
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            <Radio className={`w-5 h-5 ${isConnected ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200 tracking-wider">
                VOXCONPACK TRANSCEIVER
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-700/60 font-mono-data font-bold">
                VOXCONPACK v0.1
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                gemini-3.1-flash-live-preview
              </span>
              {isTtsFallbackActive ? (
                <span
                  id="tts-fallback-badge"
                  className="text-xs px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-600/70 font-mono-data font-bold flex items-center gap-1 animate-pulse"
                  title="Gemini Live audio unavailable; operating on default Windows Read Aloud voice"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  TTS FALLBACK: WINDOWS READ ALOUD ({fallbackVoiceName})
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-800/50 font-mono-data">
                  TTS: GEMINI LIVE AUDIO
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>STATE:</span>
              {isConnecting && <span className="text-yellow-400 animate-pulse">CONNECTING...</span>}
              {!isConnected && !isConnecting && <span className="text-slate-500">STANDBY / OFFLINE</span>}
              {isConnected && (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  ONLINE • LIVE AUDIO UPLINK
                </span>
              )}
              {isSpeaking && (
                <span className="text-blue-400 flex items-center gap-1 font-semibold ml-2">
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" /> {isTtsFallbackActive ? 'WINDOWS READ ALOUD VOCALIZING' : 'AI VOCALIZING'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls & Voice Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Vocal Persona Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2 py-1 rounded">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              VOICE:
            </span>
            <select
              id="voice-persona-select"
              value={selectedVoice}
              onChange={(e) => changeVoice(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-hidden cursor-pointer font-mono font-medium"
              title="Select Gemini Live AI Voice Persona"
            >
              <option value="Charon" className="bg-slate-900 text-slate-200">Charon (Tactical / Command)</option>
              <option value="Kore" className="bg-slate-900 text-slate-200">Kore (Warm / Articulate)</option>
              <option value="Zephyr" className="bg-slate-900 text-slate-200">Zephyr (Smooth / Crisp)</option>
              <option value="Fenrir" className="bg-slate-900 text-slate-200">Fenrir (Deep / Resonant)</option>
              <option value="Puck" className="bg-slate-900 text-slate-200">Puck (Upbeat / Dynamic)</option>
            </select>
          </div>

          {/* Test Windows Read Aloud Button */}
          <button
            type="button"
            id="test-windows-voice-btn"
            onClick={testWindowsVoice}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 transition-all"
            title={`Test Default Windows Read Aloud Voice (${fallbackVoiceName})`}
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>TEST READ ALOUD</span>
          </button>

          {isConnected ? (
            <>
              <button
                type="button"
                id="toggle-mic-btn"
                onClick={toggleMic}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all border ${
                  isMicActive
                    ? 'bg-emerald-900/30 border-emerald-600 text-emerald-300 hover:bg-emerald-900/50'
                    : 'bg-red-900/30 border-red-700 text-red-300 hover:bg-red-900/50'
                }`}
                title={isMicActive ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicActive ? (
                  <>
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <span>MIC LIVE (16kHz)</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-4 h-4 text-red-400" />
                    <span>MIC MUTED</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="disconnect-voice-btn"
                onClick={disconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 transition-all"
              >
                <Power className="w-3.5 h-3.5 text-slate-400" />
                <span>TERMINATE</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              id="connect-voice-btn"
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider bg-blue-700 hover:bg-blue-600 text-slate-100 border border-blue-500 shadow transition-all disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              <span>{isConnecting ? 'ESTABLISHING UPLINK...' : 'INITIALIZE VOICE UPLINK'}</span>
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-950/30 border border-red-800/80 rounded text-xs text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-grow">
            <span className="font-semibold">Transceiver Alert:</span> {errorMessage}
          </div>
        </div>
      )}

      {/* Main Grid: Left Transceiver Core & Presets, Right Execution Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-grow">
        {/* Left Column (5 cols): Mic Transceiver & Quick Presets */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Central Audio Radar / Visualizer */}
          <div
            className="p-4 rounded-md border flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              backgroundColor: theme.colors.bgSlate,
              borderColor: theme.colors.border,
            }}
          >
            {/* Pulsing ring indicator */}
            <div className="relative my-4 flex items-center justify-center">
              <div
                className={`w-28 h-28 rounded-full border flex items-center justify-center transition-all duration-200 ${
                  isConnected && isMicActive
                    ? 'border-blue-500/80 bg-blue-950/20 shadow-[0_0_25px_rgba(59,130,246,0.2)]'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
                style={{
                  transform: `scale(${1 + (isConnected && isMicActive ? micLevel * 0.3 : 0)})`,
                }}
              >
                {/* Secondary inner ring */}
                <div
                  className={`w-20 h-20 rounded-full border flex items-center justify-center transition-all ${
                    isSpeaking
                      ? 'border-emerald-400/80 bg-emerald-950/30'
                      : isConnected && isMicActive
                      ? 'border-blue-400/50 bg-blue-900/20'
                      : 'border-slate-700/50 bg-slate-800/40'
                  }`}
                >
                  {isMicActive ? (
                    <Mic className="w-8 h-8 text-blue-400" />
                  ) : (
                    <MicOff className="w-8 h-8 text-slate-600" />
                  )}
                </div>
              </div>

              {/* Dynamic VU bars around transceiver */}
              <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-1">
                <div className="flex flex-col gap-1">
                  {[0.8, 0.6, 0.4, 0.2].map((thresh, idx) => (
                    <div
                      key={`l-${idx}`}
                      className={`w-1.5 h-3 rounded-xs transition-colors duration-75 ${
                        micLevel >= thresh ? 'bg-blue-400' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {[0.8, 0.6, 0.4, 0.2].map((thresh, idx) => (
                    <div
                      key={`r-${idx}`}
                      className={`w-1.5 h-3 rounded-xs transition-colors duration-75 ${
                        micLevel >= thresh ? 'bg-blue-400' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Vocal Status Text */}
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                {isSpeaking
                  ? isTtsFallbackActive
                    ? `WINDOWS READ ALOUD ACTIVE (${fallbackVoiceName})`
                    : 'SYNTHESIZING VOCAL RESPONSE'
                  : isConnected && isMicActive
                  ? 'AWAITING OPERATOR VOICE ORDERS'
                  : isConnected
                  ? 'MICROPHONE MUTED (TEXT ORDERS ACTIVE)'
                  : 'INITIALIZE TO BEGIN VOICE CONTROL'}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {isTtsFallbackActive
                  ? `Gemini AI live audio is bypassed; speech synthesis is routed to default Windows Read Aloud (${fallbackVoiceName}).`
                  : 'Speak commands naturally. The AI recognizes directives, triggers system tools, and confirms execution verbally.'}
              </p>
            </div>

            {/* Live Telemetry Pill Row */}
            <div className="flex flex-wrap justify-center gap-2 mt-4 pt-3 border-t border-slate-800 w-full text-xs">
              <span className="px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800">
                ACTIVE VIEW: <strong className="text-slate-200">{activeMode}</strong>
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800">
                THEME: <strong className="text-slate-200">{currentTheme}</strong>
              </span>
              <span
                className={`px-2 py-1 rounded border ${
                  anomalySimulated
                    ? 'bg-red-950/30 text-red-400 border-red-800'
                    : 'bg-emerald-950/20 text-emerald-400 border-emerald-900'
                }`}
              >
                STATUS: <strong>{anomalySimulated ? 'SURGE ANOMALY' : 'NOMINAL'}</strong>
              </span>
            </div>
          </div>

          {/* Quick Tactical Order Presets */}
          <div
            className="p-3 rounded-md border flex flex-col gap-2 flex-grow"
            style={{
              backgroundColor: theme.colors.bgSlate,
              borderColor: theme.colors.border,
            }}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>TACTICAL ORDER PRESETS</span>
              </div>
              <span className="text-[10px] text-slate-400">CLICK TO DISPATCH</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 overflow-y-auto max-h-56 pr-1">
              {quickOrders.map((order, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (!isConnected) {
                      connect();
                    }
                    sendOrderText(order.prompt);
                  }}
                  className="px-2.5 py-1.5 text-left text-xs rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-slate-100 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{order.label}</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-400 ml-1">➔</span>
                </button>
              ))}
            </div>

            {/* Natural Language Order Input Field */}
            <form onSubmit={handleSendCustomPrompt} className="mt-2 flex gap-1.5 pt-2 border-t border-slate-800">
              <input
                type="text"
                id="voice-order-input"
                placeholder={
                  isConnected
                    ? 'Type voice order (e.g., "Computer, switch theme to noir-dark")'
                    : 'Connect uplink to submit orders'
                }
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={!isConnected}
                className="flex-grow bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                id="submit-order-btn"
                disabled={!isConnected || !customPrompt.trim()}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-slate-100 rounded text-xs font-semibold flex items-center gap-1 border border-blue-500 disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>SEND</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (7 cols): Execution Audit Log & Live Transcript */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Order Execution Audit Feed */}
          <div
            className="p-3 rounded-md border flex flex-col gap-2 h-44"
            style={{
              backgroundColor: theme.colors.bgSlate,
              borderColor: theme.colors.border,
            }}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>EXECUTED ORDERS AUDIT FEED</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {executedOrders.length} {executedOrders.length === 1 ? 'ORDER' : 'ORDERS'}
              </span>
            </div>

            <div className="flex-grow overflow-y-auto flex flex-col gap-1.5 pr-1">
              {executedOrders.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-slate-400 italic">
                  No orders executed yet. Speak or dispatch an order.
                </div>
              ) : (
                executedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                        EXEC
                      </span>
                      <span className="font-semibold text-slate-200 truncate">
                        {order.name}
                      </span>
                      <span className="text-slate-400 truncate text-[11px]">
                        {JSON.stringify(order.args)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {order.timestamp}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real-time Conversation & Transcript Terminal */}
          <div
            className="p-3 rounded-md border flex flex-col gap-2 flex-grow min-h-[260px]"
            style={{
              backgroundColor: theme.colors.bgSlate,
              borderColor: theme.colors.border,
            }}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>LIVE TRANSCRIPT & AUDIO COMM STREAM</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span className="text-[10px] text-slate-400">TELEMETRY SYNC</span>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto flex flex-col gap-2 pr-1 max-h-[300px]">
              {transcripts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 italic gap-1">
                  <Cpu className="w-6 h-6 text-slate-600 mb-1" />
                  <span>Connect uplink to initialize real-time audio channel with Gemini.</span>
                  <span className="text-[11px] text-slate-400">
                    Live bidirectional audio streamed at 16kHz capture / 24kHz playback.
                  </span>
                </div>
              ) : (
                transcripts.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2 rounded text-xs border ${
                      item.isCommand
                        ? 'bg-emerald-950/20 border-emerald-800/80 text-emerald-300'
                        : item.role === 'user'
                        ? 'bg-blue-950/20 border-blue-800/60 text-blue-200'
                        : item.role === 'model'
                        ? 'bg-slate-900 border-slate-700 text-slate-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-semibold mb-1 opacity-75">
                      <span className="uppercase tracking-wider">
                        {item.isCommand
                          ? 'SYSTEM DIRECTIVE'
                          : item.role === 'user'
                          ? 'OPERATOR VOICE INPUT'
                          : item.role === 'model'
                          ? 'MYTHOS AI VOCALIZATION'
                          : 'COMM LINK'}
                      </span>
                      <span>{item.timestamp}</span>
                    </div>
                    <div className="leading-relaxed whitespace-pre-wrap">{item.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Host Computer Control & Python Network Matrix */}
      <div
        className="p-3.5 rounded-lg border flex flex-col gap-3"
        style={{
          backgroundColor: theme.colors.bgSlate,
          borderColor: theme.colors.border,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
              VOXCONPACK // Host Computer Control & Python Network Matrix
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono-data text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ENDPOINT: /api/host/*
            </span>
            <span>|</span>
            <span className="text-cyan-400">MYTHOS ARCHITECTURE</span>
          </div>
        </div>

        <div className="px-2.5 py-1.5 rounded bg-slate-950/70 border border-slate-800 text-[11px] font-mono-data text-slate-300 flex items-center justify-between">
          <span>PRINCIPLE: <strong className="text-cyan-300">"Voice is an input modality, not authority."</strong></span>
          <span className="text-[10px] text-amber-400/90 uppercase tracking-wider hidden sm:inline">ALL SIGNAL. NO NOISE.™</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Drive & Asset Ingestion */}
          <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>DRIVE ASSET INGESTION</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Say: <code className="text-cyan-300">"Computer, load image from Z:/scans/core.png"</code>
            </p>
            <div className="text-[10px] font-mono-data text-slate-400">
              Mounted: <span className="text-slate-300">Z:\, C:\, /mnt, local paths</span> with automated tactical SVG fallback rendering.
            </div>
          </div>

          {/* Python Subprocess Bridge */}
          <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Play className="w-3.5 h-3.5" />
              <span>PYTHON RUNTIME BRIDGE</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Say: <code className="text-amber-300">"Computer, execute Python script analyze.py"</code>
            </p>
            <div className="text-[10px] font-mono-data text-slate-400">
              Daemon target: <span className="text-slate-300">localhost:8000</span> or direct CLI subprocess execution.
            </div>
          </div>

          {/* LAN & Cluster Diagnostics */}
          <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold">
              <Network className="w-3.5 h-3.5" />
              <span>NETWORK CLUSTER CONTROLS</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Say: <code className="text-blue-300">"Computer, query network node 127.0.0.1"</code>
            </p>
            <div className="text-[10px] font-mono-data text-slate-400">
              Broadcasts telemetry queries across local Python nodes and socket daemons.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
