import React from 'react';
import { AppMode, MSDHeader, ThemeId } from '../../types/msd';
import { THEMES } from '../../constants/themes';
import { soundEngine } from '../../utils/audio';
import { TemplatePresetDropdown } from '../common/TemplatePresetDropdown';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Layers,
  Sliders,
  Palette,
  Bot,
  Mic,
  MicOff,
  Power,
  Activity,
  ChevronRight,
  ShieldCheck,
  LayoutGrid,
  Pause,
  Play,
  RotateCw
} from 'lucide-react';

interface ModernAppHeaderProps {
  headerData: MSDHeader;
  currentTheme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  appMode: AppMode;
  onAppModeChange: (mode: AppMode) => void;
  onOpenThemeForge: () => void;
  onSelectTemplate?: (templateKey: string) => void;
  currentTemplateId?: string;
  voiceActive?: boolean;
  voiceConnecting?: boolean;
  voiceMicActive?: boolean;
  voiceSpeaking?: boolean;
  onConnectVoice?: () => void;
  onToggleVoiceMic?: () => void;
  onDisconnectVoice?: () => void;
}

export const ModernAppHeader: React.FC<ModernAppHeaderProps> = ({
  headerData,
  currentTheme,
  onThemeChange,
  appMode,
  onAppModeChange,
  onOpenThemeForge,
  onSelectTemplate,
  currentTemplateId,
  voiceActive,
  voiceConnecting,
  voiceMicActive,
  voiceSpeaking: _voiceSpeaking,
  onConnectVoice,
  onToggleVoiceMic,
  onDisconnectVoice,
}) => {
  const [muted, setMuted] = React.useState(soundEngine.isMuted());
  const [isEditorExpanded, setIsEditorExpanded] = React.useState<boolean>(true);
  const [prevMode, setPrevMode] = React.useState<AppMode>('msd-view');
  const theme = THEMES[currentTheme] || THEMES['noir-dark'];

  React.useEffect(() => {
    if (appMode !== 'voice-control') {
      setPrevMode(appMode);
    }
  }, [appMode]);

  const toggleSound = () => {
    const isNowMuted = soundEngine.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      soundEngine.playBeep(880, 'sine', 0.08);
    }
  };

  const handleVoiceUplinkToggle = () => {
    soundEngine.playToggle();
    if (voiceActive) {
      onDisconnectVoice?.();
    } else {
      onConnectVoice?.();
    }
  };

  const toggleVoiceControlShortcut = () => {
    soundEngine.playToggle();
    if (appMode === 'voice-control') {
      onAppModeChange(prevMode || 'msd-view');
    } else {
      onAppModeChange('voice-control');
    }
  };

  const navModes: { id: AppMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'msd-view', label: '01. MSD DISPLAY', icon: Layers },
    { id: 'ui-builder', label: '02. UI BUILDER', icon: Sliders },
    { id: 'token-inspector', label: '03. TOKEN LAB', icon: Palette },
    { id: 'ai-diagnostics', label: '04. AI DIAGNOSTIC', icon: Bot },
    { id: 'voice-control', label: '05. VOICE CONTROL', icon: Mic },
  ];

  return (
    <header
      className="w-full select-none rounded-lg border transition-all duration-200 shadow-lg p-3 flex flex-col gap-2.5"
      style={{
        backgroundColor: theme.colors.bgSlate,
        borderColor: theme.colors.border,
      }}
    >
      {/* Top Row: System Identity & Audio Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        {/* Left: Branding & Title Hierarchy */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-extrabold text-sm shadow font-mono-data"
            style={{
              backgroundColor: theme.colors.primary,
              color: '#000000',
            }}
          >
            SYS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white uppercase font-sans">
                {headerData.title || 'PRODUCTION CONSOLE'}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-mono-data uppercase font-semibold border flex items-center gap-1"
                style={{
                  backgroundColor: `${theme.colors.primary}18`,
                  borderColor: theme.colors.primary,
                  color: theme.colors.text,
                }}
              >
                <ShieldCheck className="w-2.5 h-2.5" />
                {headerData.authorizationCode || 'AUTHORIZED'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono-data flex items-center gap-1.5">
              <span>WORKSPACE</span>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <span className="text-slate-300 truncate max-w-[280px] sm:max-w-md">
                {headerData.subTitle || 'REAL-TIME TELEMETRY & MULTI-MODULE OPERATIONS'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Voice Active HUD, Editor Mode Toggle (+ / -), Audio Toggle & Telemetry State */}
        <div className="flex items-center gap-2">
          {/* Persistent Live Voice Status Badge when voice is active */}
          {voiceActive && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[#06141c] border border-emerald-500/50 text-[11px] font-mono-data text-emerald-400 shadow-sm animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold tracking-wider text-emerald-300">VOXCONPACK LIVE</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {voiceMicActive ? '(LISTENING)' : '(STANDBY)'}
              </span>
            </div>
          )}

          {/* Show / Hide Toggle between Editor Mode and Preview Actual Theme */}
          <button
            type="button"
            id="header-editor-toggle-btn"
            data-voice-target="editor mode preview theme"
            onClick={() => {
              soundEngine.playToggle();
              setIsEditorExpanded(!isEditorExpanded);
            }}
            className="px-2 py-1 text-xs font-mono-data font-bold rounded border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:brightness-125"
            style={{
              backgroundColor: isEditorExpanded ? `${theme.colors.accent}15` : `${theme.colors.primary}25`,
              borderColor: isEditorExpanded ? theme.colors.accent : theme.colors.primary,
              color: isEditorExpanded ? theme.colors.accent : theme.colors.primary,
            }}
            title={
              isEditorExpanded
                ? '[-] Hide editor controls to preview actual theme (Voice: "Preview Theme")'
                : '[+] Show editor controls (Voice: "Editor Mode")'
            }
          >
            <span className="text-sm font-black leading-none w-3 text-center">
              {isEditorExpanded ? '−' : '+'}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isEditorExpanded ? 'PREVIEW THEME' : 'EDITOR MODE'}
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            id="header-sound-toggle-btn"
            onClick={toggleSound}
            className="p-1.5 rounded border border-[#2a3447] text-slate-400 hover:text-white hover:border-slate-400 transition-colors cursor-pointer bg-[#0b0f19]"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          </button>

          {/* Voice Uplink Master & Standby Controller: Immediately INITIALIZES VOICE UPLINK, TERMINATES, and STANDBY PAUSE */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="header-voice-control-shortcut-btn"
              onClick={handleVoiceUplinkToggle}
              disabled={voiceConnecting}
              className={`p-1.5 rounded border transition-all cursor-pointer flex items-center gap-1.5 ${
                voiceActive
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                  : voiceConnecting
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
                  : 'bg-[#0b0f19] border-[#2a3447] text-slate-400 hover:text-white hover:border-slate-400'
              }`}
              title={
                voiceActive
                  ? 'Terminate Voice Uplink (Sever Gemini Live Session)'
                  : voiceConnecting
                  ? 'Establishing Voice Uplink...'
                  : 'Initialize Voice Uplink (Connect Live Gemini Session)'
              }
            >
              {voiceConnecting ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : voiceActive ? (
                <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-300" />
              )}
              {voiceActive && (
                <span className="text-[10px] font-mono-data font-bold tracking-wider text-emerald-300 pr-0.5">
                  LIVE
                </span>
              )}
            </button>

            {/* Standby / Pause Button: Appears when Uplink is Connected */}
            {voiceActive && (
              <button
                type="button"
                id="header-voice-standby-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playToggle();
                  onToggleVoiceMic?.();
                }}
                className={`p-1.5 rounded border transition-all cursor-pointer flex items-center justify-center ${
                  voiceMicActive
                    ? 'bg-[#0b0f19] border-emerald-700/60 text-emerald-400 hover:text-emerald-200 hover:border-emerald-500'
                    : 'bg-amber-950/80 border-amber-600 text-amber-300 hover:bg-amber-900 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                }`}
                title={
                  voiceMicActive
                    ? 'Standby Mode (Pause Microphone - Keeps Session Alive)'
                    : 'Resume Voice (Exit Standby - Mic Transmitting)'
                }
              >
                {voiceMicActive ? (
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                )}
              </button>
            )}
          </div>

          {/* Live Pulse Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[#060a12] border border-[#1e293b] font-mono-data text-[10px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ONLINE</span>
          </div>
        </div>
      </div>

      {/* Editor Controls: Nav Elements & Switch Template Preset (Show/Hide via + and -) */}
      {isEditorExpanded && (
        <>
          {/* Header Nav Elements DIV: 100% Width */}
          <div className="w-full bg-[#070b12] p-1.5 rounded-md border border-[#1f293d]">
            <nav className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
              {navModes.map((item) => {
                const isActive = appMode === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    id={`nav-btn-${item.id}`}
                    data-voice-target={item.label.toLowerCase()}
                    onClick={() => {
                      soundEngine.playToggle();
                      onAppModeChange(item.id);
                    }}
                    className={`w-full py-1.5 px-2 text-xs font-mono-data font-semibold rounded flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'text-black shadow'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                    style={{
                      backgroundColor: isActive ? theme.colors.primary : 'transparent',
                    }}
                    title={`${item.label} (Voice: '${item.label}')`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-black' : item.id === 'voice-control' && voiceActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.id === 'voice-control' && voiceActive && (
                      <span className="flex items-center gap-1 px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        LIVE
                      </span>
                    )}
                  </button>
                );
              })}

              {/* 06. SKETCH THEME */}
              <button
                type="button"
                id="nav-btn-sketch-theme"
                data-voice-target="sketch theme theme forge"
                onClick={() => {
                  soundEngine.playChime();
                  onOpenThemeForge();
                }}
                className="w-full py-1.5 px-2 text-xs font-mono-data font-semibold rounded flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer text-amber-300 hover:text-amber-100 hover:bg-amber-400/10 border border-amber-500/30 shadow-sm"
                title="Synthesize a new Theme and Page Template from sketches or files (Voice: 'Sketch Theme' or 'Theme Forge')"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                <span>06. SKETCH THEME</span>
              </button>
            </nav>
          </div>

          {/* Positioned Under Nav Elements: SWITCH TEMPLATE PRESET Bar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-md bg-[#060a14] border border-[#1b2537] text-xs font-mono-data">
            <div className="flex items-center gap-2 flex-wrap">
              <TemplatePresetDropdown
                currentLayoutId={currentTemplateId || 'cloud-telemetry-dashboard'}
                currentTheme={currentTheme}
                onSelectPreset={onSelectTemplate ? onSelectTemplate : onThemeChange}
                showLabel={true}
                compact={false}
              />
            </div>

            <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono-data">
              <div className="hidden md:flex items-center gap-1.5">
                <span className="text-slate-500 uppercase">ACTIVE THEME:</span>
                <span className="text-amber-300 font-bold">{theme.name}</span>
              </div>
              <span className="hidden md:inline text-slate-600">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 uppercase hidden sm:inline">MODE:</span>
                <span className="text-cyan-300 font-semibold uppercase">{appMode.replace('-', ' ')}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
