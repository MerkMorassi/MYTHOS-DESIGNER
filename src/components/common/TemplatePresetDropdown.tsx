import React from 'react';
import { ThemeId } from '../../types/msd';
import { THEMES } from '../../constants/themes';
import { getUnifiedTemplatePresets, TEMPLATE_PRESETS } from '../../constants/templates';
import { soundEngine } from '../../utils/audio';
import { Sliders } from 'lucide-react';

interface TemplatePresetDropdownProps {
  currentLayoutId: string;
  currentTheme: ThemeId;
  onSelectPreset: (presetKey: string) => void;
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

export const TemplatePresetDropdown: React.FC<TemplatePresetDropdownProps> = ({
  currentLayoutId,
  currentTheme,
  onSelectPreset,
  showLabel = true,
  compact = false,
  className = '',
}) => {
  const theme = THEMES[currentTheme] || THEMES['noir-dark'];
  const presets = getUnifiedTemplatePresets();

  // Find active preset key matching current layout ID or theme ID
  const activePreset = presets.find(
    (p) => p.layoutId === currentLayoutId || p.themeId === currentTheme
  );
  const activeValue = activePreset ? activePreset.key : currentLayoutId;

  // Collect any custom synthesized themes that are not standard
  const customThemes = Object.values(THEMES).filter((t) => t.isCustom);

  // Group presets by category
  const categories = Array.from(new Set(presets.map((p) => p.category)));

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = e.target.value;
    soundEngine.playChime();
    onSelectPreset(selectedKey);
  };

  return (
    <div className={`flex items-center gap-2 font-mono-data ${className}`}>
      {showLabel && (
        <label
          htmlFor="switch-template-preset-select"
          className="text-slate-300 font-bold text-xs uppercase flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="whitespace-nowrap">SWITCH TEMPLATE PRESET:</span>
        </label>
      )}

      <select
        id="switch-template-preset-select"
        value={activeValue}
        onChange={handleChange}
        className={`bg-[#0a0f1d] border text-slate-100 font-bold uppercase rounded transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer shadow-sm ${
          compact
            ? 'px-2 py-1 text-[11px] max-w-[200px] sm:max-w-[240px]'
            : 'px-2.5 py-1.5 text-xs max-w-[240px] sm:max-w-[280px]'
        }`}
        style={{
          borderColor: theme.colors.border,
        }}
        title="Select a unified layout template & theme preset"
      >
        {categories.map((category) => (
          <optgroup key={category} label={`━━ ${category} ━━`} className="bg-[#0b101c] text-cyan-400 font-bold">
            {presets
              .filter((p) => p.category === category)
              .map((p) => (
                <option
                  key={p.key}
                  value={p.key}
                  className="bg-[#0a0e1a] text-slate-200 py-1"
                >
                  {p.name}
                </option>
              ))}
          </optgroup>
        ))}

        {customThemes.length > 0 && (
          <optgroup label="━━ Custom Extrapolated Templates ━━" className="bg-[#0b101c] text-purple-400 font-bold">
            {customThemes.map((ct) => (
              <option key={ct.id} value={`custom-${ct.id}`} className="bg-[#0a0e1a] text-purple-200">
                ★ {ct.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
};
