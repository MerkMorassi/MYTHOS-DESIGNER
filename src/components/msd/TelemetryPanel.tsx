import React from 'react';
import { MSDNode, SystemMetric, ThemeId } from '../../types/msd';
import { THEMES } from '../../constants/themes';
import { soundEngine } from '../../utils/audio';
import { Activity, Sliders, ShieldCheck, Zap, AlertCircle, X, BarChart3, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';

interface TelemetryPanelProps {
  metrics: Record<string, SystemMetric>;
  selectedNode: MSDNode | null;
  onCloseSelectedNode: () => void;
  onUpdateMetric: (key: string, newValue: number) => void;
  currentTheme: ThemeId;
  anomalySimulated: boolean;
}

export function calculateStabilityForecast(m: SystemMetric) {
  const history = m.history || [];
  if (history.length === 0) {
    return { sma: m.value, trend: 'STABLE' as const, risk: 'LOW' as const, riskScore: 0, delta: 0 };
  }
  
  const sma = history.reduce((sum, val) => sum + val, 0) / history.length;
  
  const recentHistory = history.slice(-3);
  let delta = 0;
  if (recentHistory.length >= 2) {
    delta = recentHistory[recentHistory.length - 1] - recentHistory[0];
  }
  
  let trend: 'UPWARD' | 'DOWNWARD' | 'STABLE' = 'STABLE';
  const rangeWidth = m.max - m.min;
  const movementThreshold = rangeWidth * 0.003;
  if (Math.abs(delta) > movementThreshold) {
    trend = delta > 0 ? 'UPWARD' : 'DOWNWARD';
  }

  const [nomMin, nomMax] = m.nominalRange;
  let riskScore = 0;
  
  if (sma >= nomMax || sma <= nomMin) {
    riskScore = 100;
  } else {
    const distToMax = nomMax - sma;
    const distToMin = sma - nomMin;
    const totalNominalSpan = nomMax - nomMin;
    
    const minDistancePercent = Math.min(distToMax, distToMin) / (totalNominalSpan / 2);
    const closeness = 1 - minDistancePercent;
    
    riskScore = closeness * 70;
    
    if (trend === 'UPWARD' && distToMax < distToMin) {
      riskScore += 20;
    } else if (trend === 'DOWNWARD' && distToMin < distToMax) {
      riskScore += 20;
    }
    
    riskScore = Math.min(95, Math.max(0, riskScore));
  }

  let risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (riskScore >= 80) {
    risk = 'CRITICAL';
  } else if (riskScore >= 50) {
    risk = 'HIGH';
  } else if (riskScore >= 25) {
    risk = 'MODERATE';
  }

  return {
    sma,
    trend,
    risk,
    riskScore: Math.round(riskScore),
    delta,
  };
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
 
      {/* Predictive Stability Forecast Indicator */}
      <div className="bg-[#101216] p-3 rounded border border-purple-500/30 flex flex-col gap-2 relative">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#2f3749]">
          <div className="flex items-center gap-1.5 font-antonio font-bold text-xs uppercase text-purple-400 tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>STABILITY FORECAST MATRIX</span>
          </div>
          <span className="font-mono-data text-[9px] text-purple-400 font-bold bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800">
            PREDICTIVE
          </span>
        </div>

        {selectedMetric ? (() => {
          const forecast = calculateStabilityForecast(selectedMetric);
          return (
            <div className="space-y-2 font-mono-data text-xs animate-fade-in">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">INSPECTED VECTOR:</span>
                <span className="text-cyan-300 font-bold uppercase truncate max-w-[120px]">{selectedMetric.label}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">SMA (MOVING AVG):</span>
                <span className="text-slate-200 font-bold">{forecast.sma.toFixed(2)} {selectedMetric.unit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">TREND VECTOR:</span>
                <span className={`font-bold flex items-center gap-1 ${
                  forecast.trend === 'UPWARD' ? 'text-amber-400' : forecast.trend === 'DOWNWARD' ? 'text-blue-400' : 'text-emerald-400'
                }`}>
                  {forecast.trend === 'UPWARD' ? <TrendingUp className="w-3 h-3" /> : forecast.trend === 'DOWNWARD' ? <TrendingDown className="w-3 h-3" /> : null}
                  {forecast.trend}
                </span>
              </div>
              <div className="space-y-1 pt-1.5 border-t border-[#2f3749]/60">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">ANOMALY TRIGGER RISK:</span>
                  <span className={`font-bold ${
                    forecast.risk === 'CRITICAL' ? 'text-red-500 animate-pulse' : forecast.risk === 'HIGH' ? 'text-orange-400' : forecast.risk === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {forecast.risk} ({forecast.riskScore}%)
                  </span>
                </div>
                <div className="w-full bg-[#050608] h-1.5 rounded-full overflow-hidden border border-[#2f3749]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      forecast.risk === 'CRITICAL' ? 'bg-red-500' : forecast.risk === 'HIGH' ? 'bg-orange-400' : forecast.risk === 'MODERATE' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${forecast.riskScore}%` }}
                  />
                </div>
              </div>
              {forecast.riskScore >= 50 && (
                <div className="mt-1 p-1.5 bg-red-950/20 border border-red-500/30 rounded text-[10px] text-red-300 flex items-start gap-1 leading-normal">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>PRE-ANOMALY DRIFT: Moving average approaching critical boundary. Calibration recommended.</span>
                </div>
              )}
            </div>
          );
        })() : (() => {
          const allMetrics = Object.values(metrics) as SystemMetric[];
          let maxRiskScore = 0;
          let mostAtRiskMetric: SystemMetric | null = null;
          
          allMetrics.forEach(m => {
            const forecast = calculateStabilityForecast(m);
            if (forecast.riskScore > maxRiskScore) {
              maxRiskScore = forecast.riskScore;
              mostAtRiskMetric = m;
            }
          });

          const maxRisk = maxRiskScore >= 80 ? 'CRITICAL' : maxRiskScore >= 50 ? 'HIGH' : maxRiskScore >= 25 ? 'MODERATE' : 'LOW';

          return (
            <div className="space-y-2 font-mono-data text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">OVERALL RISK PROFILE:</span>
                <span className={`font-bold ${
                  maxRisk === 'CRITICAL' ? 'text-red-500 animate-pulse' : maxRisk === 'HIGH' ? 'text-orange-400' : maxRisk === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {maxRisk}
                </span>
              </div>
              
              <div className="w-full bg-[#050608] h-1.5 rounded-full overflow-hidden border border-[#2f3749]">
                <div
                  className={`h-full transition-all duration-500 ${
                    maxRisk === 'CRITICAL' ? 'bg-red-500' : maxRisk === 'HIGH' ? 'bg-orange-400' : maxRisk === 'MODERATE' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.max(5, maxRiskScore)}%` }}
                />
              </div>

              {mostAtRiskMetric ? (() => {
                const metricName = (mostAtRiskMetric as SystemMetric).label;
                const mKey = (mostAtRiskMetric as SystemMetric).key;
                const f = calculateStabilityForecast(mostAtRiskMetric as SystemMetric);
                return (
                  <div className="pt-1 border-t border-[#2f3749]/60 text-[10px] space-y-1">
                    <div className="text-slate-400 uppercase tracking-tighter">PRIMARY VECTOR OF DRIFT:</div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-bold truncate max-w-[130px]">{metricName}</span>
                      <span className={`font-bold flex items-center gap-0.5 ${
                        f.trend === 'UPWARD' ? 'text-amber-400' : f.trend === 'DOWNWARD' ? 'text-blue-400' : 'text-emerald-400'
                      }`}>
                        {f.trend === 'UPWARD' ? <TrendingUp className="w-3 h-3" /> : f.trend === 'DOWNWARD' ? <TrendingDown className="w-3 h-3" /> : null}
                        {f.trend}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>SMA VS ACTUAL:</span>
                      <span>{f.sma.toFixed(1)} vs {(mostAtRiskMetric as SystemMetric).value.toFixed(1)}</span>
                    </div>
                    {maxRiskScore >= 50 && (
                      <div className="p-1 bg-amber-950/30 border border-amber-600/30 rounded text-[9px] text-amber-300 mt-1 flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>High drift in vector {mKey}. Correct override is advised before trigger thresholds breach.</span>
                      </div>
                    )}
                  </div>
                );
              })() : null}
            </div>
          );
        })()}
      </div>

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
