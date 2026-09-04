import React, { useState, useEffect } from 'react';
import { AppMode, MSDHeader, ThemeId } from '../../types/msd';
import { THEMES } from '../../constants/themes';
import { PillboxButton } from './PillboxButton';
import { soundEngine } from '../../utils/audio';
import { Volume2, VolumeX, Sparkles, Sliders, ShieldCheck, Layers, Cpu, Mic } from 'lucide-react';

interface ArchHeaderProps {
  headerData: MSDHeader;
  currentTheme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  appMode: AppMode;
  onAppModeChange: (mode: AppMode) => void;
}

export const ArchHeader: React.FC<ArchHeaderProps> = ({
  headerData,
  currentTheme,
  onThemeChange,
  appMode,
  onAppModeChange,
}) => {
  const [audioEnabled, setAudioEnabled] = useState(soundEngine.enabled);
  const [stardate, setStardate] = useState(headerData.stardate);
  const theme = THEMES[currentTheme];

  // Update stardate dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const sd = (103900 + (now.getTime() % 8640000) / 86400).toFixed(2);
      setStardate(sd);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleAudio = () => {
    soundEngine.enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      soundEngine.playBeep(880, 'sine', 0.1);
    }
  };

  return (
    <header className="w-full flex flex-col gap-1 select-none">
      {/* Upper Status & App Mode Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 bg-[#0b0e14] border-b border-[#2f3749] text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono-data text-cyan-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wider">{headerData.authorizationCode}</span>
          </div>
          <span className="text-[#2f3749]">|</span>
          <div className="hidden sm:flex items-center gap-2 font-mono-data text-slate-400">
            <span>SYS-TIME:</span>
            <span className="text-yellow-400 font-bold">{stardate}</span>
          </div>
        </div>

        {/* Primary Engine Mode Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <PillboxButton
            size="sm"
            active={appMode === 'msd-view'}
            onClick={() => onAppModeChange('msd-view')}
            color={appMode === 'msd-view' ? theme.colors.accent : theme.colors.secondary}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            01. MSD DISPLAY
          </PillboxButton>

          <PillboxButton
            size="sm"
            active={appMode === 'ui-builder'}
            onClick={() => onAppModeChange('ui-builder')}
            color={appMode === 'ui-builder' ? theme.colors.accent : theme.colors.secondary}
          >
            <Sliders className="w-3.5 h-3.5 inline mr-1" />
            02. UI BUILDER
          </PillboxButton>

          <PillboxButton
            size="sm"
            active={appMode === 'token-inspector'}
            onClick={() => onAppModeChange('token-inspector')}
            color={appMode === 'token-inspector' ? theme.colors.accent : theme.colors.secondary}
          >
            <Cpu className="w-3.5 h-3.5 inline mr-1" />
            03. TOKEN LAB
          </PillboxButton>

          <PillboxButton
            size="sm"
            active={appMode === 'ai-diagnostics'}
            onClick={() => onAppModeChange('ai-diagnostics')}
            color={appMode === 'ai-diagnostics' ? theme.colors.accent : theme.colors.secondary}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1 text-yellow-400" />
            04. AI DIAGNOSTIC
          </PillboxButton>

          <PillboxButton
            size="sm"
            active={appMode === 'voice-control'}
            onClick={() => onAppModeChange('voice-control')}
            color={appMode === 'voice-control' ? theme.colors.accent : theme.colors.secondary}
          >
            <Mic className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
            05. VOICE CONTROL
          </PillboxButton>
        </div>

        {/* Theme & Audio Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Selector Dropdown */}
          <select
            value={currentTheme}
            onChange={(e) => {
              soundEngine.playToggle();
              onThemeChange(e.target.value as ThemeId);
            }}
            className="bg-[#111111] border border-[#333333] text-xs font-antonio font-bold uppercase text-slate-300 px-2 py-1 rounded-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {Object.values(THEMES).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            title={audioEnabled ? 'Mute Tactical Audio' : 'Unmute Tactical Audio'}
            className="p-1.5 rounded-sm bg-[#111111] border border-[#333333] text-slate-300 hover:text-blue-400 hover:border-blue-400 transition-colors"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Main Curved Arch Frame Header */}
      <div className="relative w-full flex items-stretch min-h-[54px] rounded-t-xl overflow-hidden bg-[#0a0a0a] border-t-2 border-[#333333]">
        {/* Left Curved Elbow Cap */}
        <div
          className="w-24 sm:w-36 flex-shrink-0 flex items-center justify-center p-2 rounded-tl-2xl transition-colors duration-300"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <div className={`font-antonio font-extrabold text-sm sm:text-base tracking-widest text-center leading-tight ${currentTheme === 'noir-dark' ? 'text-slate-200' : 'text-black'}`}>
            MYTH
            <br />
            OS
          </div>
        </div>

        {/* Arch Connector Gap Bar */}
        <div className="w-2 bg-[#000000] flex-shrink-0" />

        {/* Arch Title & Telemetry Header Bar */}
        <div
          className="flex-grow flex flex-col justify-center px-4 py-2 transition-colors duration-300 relative overflow-hidden"
          style={{
            background: `linear-gradient(90deg, ${theme.colors.secondary} 0%, ${theme.colors.bgSlate} 100%)`,
            borderBottom: `2px solid ${theme.colors.accent}`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="font-antonio text-base sm:text-xl md:text-2xl font-black uppercase tracking-widest text-slate-200 leading-none">
                {headerData.title}
              </h1>
                {headerData.subTitle && (
                <p className="font-mono-data text-[10px] sm:text-xs tracking-wider mt-0.5 opacity-90 text-slate-400">
                  {headerData.subTitle}
                </p>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-4 font-mono-data text-xs">
              <div className="flex items-center gap-1.5 bg-[#000000]/70 px-2.5 py-1 rounded border border-[#333333]">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-slate-400">SYSTEM COHERENCE:</span>
                <span className="text-green-400 font-bold">99.98%</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#000000]/70 px-2.5 py-1 rounded border border-[#333333]">
                <span className="text-slate-400">ENTROPY:</span>
                <span className="text-yellow-400 font-bold">0.042 ρS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Terminal Cap */}
        <div
          className={`w-12 sm:w-20 flex-shrink-0 transition-colors duration-300 flex items-center justify-center font-antonio font-bold text-xs ${currentTheme === 'noir-dark' ? 'text-slate-200' : 'text-black'}`}
          style={{ backgroundColor: theme.colors.accent }}
        >
          v1.0
        </div>
      </div>
    </header>
  );
};
