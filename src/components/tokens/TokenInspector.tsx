import React, { useState } from 'react';
import { ThemeId } from '../../types/msd';
import { THEMES } from '../../constants/themes';
import { GeometryLab } from './GeometryLab';
import { Cpu, Palette, Type, Check, Copy, Ruler } from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface TokenInspectorProps {
  currentTheme: ThemeId;
}

export const TokenInspector: React.FC<TokenInspectorProps> = ({ currentTheme }) => {
  const theme = THEMES[currentTheme];
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const cssTokens = [
    { var: '--sys-bg-obsidian', val: theme.colors.bgObsidian, desc: 'Base Canvas Obsidian (#000)' },
    { var: '--sys-bg-slate', val: theme.colors.bgSlate, desc: 'Panel & Container Slate (#111)' },
    { var: '--sys-secondary-surface', val: theme.colors.secondary, desc: 'Secondary Surface Bar (#222)' },
    { var: '--sys-border', val: theme.colors.border, desc: 'Structural Border & Divider (#333)' },
    { var: '--sys-primary-frame', val: theme.colors.primary, desc: 'Primary Control Cap (#444)' },
    { var: '--sys-accent', val: theme.colors.accent, desc: 'Accent & Highlight' },
    { var: '--sys-alert', val: theme.colors.alert, desc: 'Critical Alert Red' },
    { var: '--sys-live', val: theme.colors.live, desc: 'Live Nominal Status' },
    { var: '--sys-text', val: theme.colors.text, desc: 'High-Contrast Primary Text' },
    { var: '--sys-text-muted', val: theme.colors.textMuted, desc: 'Muted Secondary Readout Text' },
  ];

  const handleCopy = (tokenVar: string) => {
    soundEngine.playChime();
    navigator.clipboard.writeText(`var(${tokenVar})`);
    setCopiedToken(tokenVar);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none">
      {/* Token Header Banner */}
      <div className="p-4 bg-[#0a0d12] border-2 border-[#2f3749] rounded-xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          <Palette className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="font-antonio font-extrabold text-lg uppercase text-slate-100 tracking-wider">
              MythOS DESIGN ENGINE // TOKEN TAXONOMY
            </h2>
            <p className="font-mono-data text-xs text-slate-400">
              No-Regression Design Tokens, Color Taxonomy, & Structural Geometry Rules.
            </p>
          </div>
        </div>

        <span className={`font-mono-data text-xs font-bold px-3 py-1 rounded ${currentTheme === 'noir-dark' ? 'text-white bg-[#444444] border border-[#555555]' : 'text-black bg-[#00eeee]'}`}>
          THEME: {theme.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Taxonomy & CSS Variables Grid */}
        <div className="flex flex-col gap-3 bg-[#0a0d12] p-4 rounded-xl border border-[#2f3749]">
          <div className="font-antonio font-bold text-sm text-cyan-300 uppercase tracking-wider pb-2 border-b border-[#2f3749] flex items-center justify-between">
            <span>2.1 COLOR TAXONOMY & VARIABLES</span>
            <span className="font-mono-data text-[10px] text-slate-400">CSS CUSTOM PROPERTIES</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {cssTokens.map((t) => (
              <div
                key={t.var}
                onClick={() => handleCopy(t.var)}
                className="flex items-center justify-between p-2.5 bg-[#101216] border border-[#2f3749] hover:border-cyan-400 rounded cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded border border-white/20 shadow-md flex-shrink-0"
                    style={{ backgroundColor: t.val }}
                  />
                  <div>
                    <div className="font-mono-data text-xs text-slate-200 font-bold group-hover:text-cyan-300">
                      {t.var}
                    </div>
                    <div className="font-mono-data text-[10px] text-slate-400">{t.val}</div>
                  </div>
                </div>

                <button type="button" className="text-slate-400 group-hover:text-white p-1">
                  {copiedToken === t.var ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Typographic Pairing Rules */}
        <div className="flex flex-col gap-3 bg-[#0a0d12] p-4 rounded-xl border border-[#2f3749]">
          <div className="font-antonio font-bold text-sm text-cyan-300 uppercase tracking-wider pb-2 border-b border-[#2f3749] flex items-center justify-between">
            <span>2.2 TYPOGRAPHIC PAIRINGS</span>
            <Type className="w-4 h-4 text-amber-400" />
          </div>

          <div className="space-y-4 font-mono-data text-xs">
            <div className="p-3 bg-[#101216] rounded border border-[#2f3749]">
              <div className="text-amber-400 font-bold mb-1">DISPLAY & CONTROL HEADERS</div>
              <div className="font-antonio text-xl font-bold uppercase tracking-widest text-white">
                MythOS // COMMAND MATRIX WORKSTATION
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Font: Antonio / Arial Narrow (Uppercase, tracked out, bold weight)
              </div>
            </div>

            <div className="p-3 bg-[#101216] rounded border border-[#2f3749]">
              <div className="text-amber-400 font-bold mb-1">TELEMETRY & CODE DATA</div>
              <div className="font-mono-data text-sm text-cyan-300">
                0x4F8A // COHERENCE Φ: 0.998 // ENTROPY: 0.042 ρS
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Font: JetBrains Mono / Fira Code (Monospaced, crisp line height)
              </div>
            </div>

            <div className="p-3 bg-[#101216] rounded border border-[#2f3749]">
              <div className="text-amber-400 font-bold mb-1">BODY & EXPLANATORY PROSE</div>
              <div className="text-slate-300 max-w-prose leading-relaxed">
                The MythOS Design Engine decouples visual presentation into standardized design tokens, modular structural frames, and schema-driven MSD canvases.
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Constrained line width: 65–75 characters (65ch) for baseline readability.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structural Geometry Lab */}
      <GeometryLab />
    </div>
  );
};
