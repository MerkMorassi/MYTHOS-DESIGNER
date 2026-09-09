import React from 'react';
import { MSDNode, SystemMetric, ThemeId } from '../../types/msd';
import { THEMES } from '../../constants/themes';
import { soundEngine } from '../../utils/audio';
import { Activity, Sliders, ShieldCheck, Zap, AlertCircle, X, BarChart3 } from 'lucide-react';

interface TelemetryPanelProps {
  metrics: Record<string, SystemMetric>;
  selectedNode: MSDNode | null;
  onCloseSelectedNode: () => void;
  onUpdateMetric: (key: string, newValue: number) => void;
  currentTheme: ThemeId;
  anomalySimulated: boolean;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  metrics,
  selectedNode,
  onCloseSelectedNode,
  onUpdateMetric,
  currentTheme,
  anomalySimulated,
}) => {
  const theme = THEMES[currentTheme];

  const selectedMetric = selectedNode ? metrics[selectedNode.metricKey] : null;

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-3 bg-[#0a0d12] p-3 rounded-lg border border-[#2f3749] select-none">
      {/* Panel Title */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2f3749]">
        <div className="flex items-center gap-2 font-antonio font-extrabold text-sm uppercase text-slate-100 tracking-wider">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>TELEMETRY METRICS & CONTROL</span>
        </div>
        <span className="font-mono-data text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
          REAL-TIME
        </span>
      </div>

      {/* Selected Node Inspector Detail (If Active) */}
      {selectedNode ? (
        <div className="bg-[#101216] p-3 rounded border border-cyan-500/50 flex flex-col gap-2 relative animate-fade-in">
          <button
            type="button"
            onClick={() => {
              soundEngine.playToggle();
              onCloseSelectedNode();
            }}
            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="font-antonio font-bold text-sm text-cyan-300 uppercase tracking-wider pr-6">
            NODE INSPECTOR // {selectedNode.label}
          </div>

          <div className="text-xs font-mono-data text-slate-300">
            {selectedNode.description || 'Primary system hotspot telemetry node.'}
          </div>

          {selectedMetric && (
            <div className="mt-2 p-2 bg-[#050608] rounded border border-[#2f3749] space-y-2 font-mono-data text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">CURRENT VALUE:</span>
                <span className="text-amber-400 font-bold text-sm">
                  {selectedMetric.value.toFixed(2)} {selectedMetric.unit}
                </span>
              </div>

              {/* Live Metric Adjustment Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>OVERRIDE VALUE</span>
                  <span>{selectedMetric.min} - {selectedMetric.max}</span>
                </div>
                <input
                  type="range"
                  id="metric-slider-override"
                  name={selectedMetric.key}
                  data-voice-target={`${selectedMetric.label} ${selectedMetric.key} override knob slider`}
                  min={selectedMetric.min}
                  max={selectedMetric.max}
                  step={(selectedMetric.max - selectedMetric.min) / 100}
                  value={selectedMetric.value}
                  onChange={(e) => {
                    soundEngine.playBeep(600, 'sine', 0.02, 0.02);
                    onUpdateMetric(selectedMetric.key, parseFloat(e.target.value));
                  }}
                  className="w-full h-1.5 bg-[#1c3c55] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Status Badge */}
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#2f3749]">
                <span className="text-slate-400">HARMONIC PARITY:</span>
                <span
                  className={`font-bold uppercase ${
                    selectedMetric.status === 'critical'
                      ? 'text-red-400'
                      : selectedMetric.status === 'warning'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {selectedMetric.status}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#101216]/50 p-2.5 rounded border border-[#2f3749] text-xs font-mono-data text-slate-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>Click any hotspot node on the MSD Canvas to inspect metrics.</span>
        </div>
      )}

      {/* Live System Metrics List */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[380px] pr-1">
        {(Object.values(metrics) as SystemMetric[]).map((m) => {
          const percent = ((m.value - m.min) / (m.max - m.min)) * 100;
          return (
            <div
              key={m.key}
              id={`metric-card-${m.key}`}
              data-voice-target={`${m.label.toLowerCase()} card`}
              className="bg-[#101216] p-2.5 rounded border border-[#2f3749] flex flex-col gap-1.5 hover:border-cyan-500/40 transition-colors"
            >
              <div className="flex items-center justify-between font-antonio text-xs font-bold uppercase tracking-wider text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {m.label}
                </span>
                <span className="font-mono-data text-amber-400 text-xs font-bold">
                  {m.value.toFixed(1)} {m.unit}
                </span>
              </div>

              {/* Gauge Progress Bar */}
              <div className="w-full bg-[#050608] h-2 rounded-full overflow-hidden border border-[#2f3749] relative">
                <div
                  className={`h-full transition-all duration-300 ${
                    m.status === 'critical'
                      ? 'bg-red-500 animate-pulse'
                      : m.status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                />
              </div>

              {/* Slider Controller */}
              <div className="flex items-center justify-between font-mono-data text-[10px] text-slate-400 pt-0.5">
                <span>{m.min}</span>
                <input
                  type="range"
                  id={`slider-${m.key}`}
                  name={m.key}
                  data-voice-target={`${m.label.toLowerCase()} ${m.key} knob slider`}
                  min={m.min}
                  max={m.max}
                  step={(m.max - m.min) / 50}
                  value={m.value}
                  onChange={(e) => onUpdateMetric(m.key, parseFloat(e.target.value))}
                  className="w-28 h-1 bg-[#1c3c55] rounded appearance-none cursor-pointer accent-cyan-400"
                  title={`${m.label} Knob (Voice: 'Adjust ${m.label} to [value]')`}
                />
                <span>{m.max}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Thermodynamic Entropy Waveform Sparkline */}
      <div className="bg-[#0b0e14] p-2.5 rounded border border-[#2f3749] flex flex-col gap-1">
        <div className="flex items-center justify-between font-antonio text-xs font-bold uppercase tracking-wider text-slate-300">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            ENTROPY HARMONIC WAVEFORM
          </span>
          <span className="font-mono-data text-[10px] text-amber-400">ρS GRAPH</span>
        </div>

        <div className="h-12 w-full bg-[#050608] rounded border border-[#2f3749] flex items-end p-1 gap-1 overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => {
            const h = Math.floor(Math.random() * 80) + 10;
            return (
              <div
                key={i}
                className={`flex-1 transition-all duration-300 ${
                  anomalySimulated ? 'bg-red-500' : 'bg-cyan-400'
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
      </div>
    </aside>
  );
};
