import React from 'react';
import { MSDCanvasConfig, MSDNode, SystemMetric, ThemeId } from '../../types/msd';
import { VectorSchematics } from './VectorSchematics';
import { ThermodynamicOverlay } from './ThermodynamicOverlay';
import { HotspotNode } from './HotspotNode';
import { DataCascade } from '../common/DataCascade';
import { THEMES } from '../../constants/themes';
import { Eye, Shield, Cpu, Activity } from 'lucide-react';

interface SchematicCanvasProps {
  canvasConfig: MSDCanvasConfig;
  metrics: Record<string, SystemMetric>;
  currentTheme: ThemeId;
  selectedNode: MSDNode | null;
  onSelectNode: (node: MSDNode) => void;
  anomalySimulated: boolean;
  isBuilderMode?: boolean;
}

export const SchematicCanvas: React.FC<SchematicCanvasProps> = ({
  canvasConfig,
  metrics,
  currentTheme,
  selectedNode,
  onSelectNode,
  anomalySimulated,
  isBuilderMode = false,
}) => {
  const theme = THEMES[currentTheme];

  return (
    <div className="relative w-full flex-grow flex flex-col bg-[#000000] rounded-xl border-2 border-[#333333] overflow-hidden select-none min-h-[460px] shadow-2xl">
      {/* Top Canvas Frame Bar */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 transition-colors duration-300 font-antonio text-xs font-bold uppercase tracking-widest ${currentTheme === 'noir-dark' ? 'text-slate-200' : 'text-black'}`}
        style={{ backgroundColor: theme.colors.primary }}
      >
        <div className="flex items-center gap-2">
          <Eye className={`w-4 h-4 ${currentTheme === 'noir-dark' ? 'text-slate-200' : 'text-black'}`} />
          <span>
            MSD CANVAS // SCHEMATIC: {canvasConfig.schematicType.replace('_', ' ')}
          </span>
        </div>

        <div className={`flex items-center gap-3 font-mono-data text-[10px] ${currentTheme === 'noir-dark' ? 'text-slate-300' : 'text-black'}`}>
          <span>OVERLAY: {canvasConfig.overlayType || 'THERMODYNAMIC'}</span>
          <span>|</span>
          <span>NODES: {canvasConfig.nodes.length}</span>
        </div>
      </div>

      {/* Main Vector / Canvas Workspace Layer */}
      <div className="relative w-full h-full flex-grow flex items-center justify-center p-4 overflow-hidden bg-[#000000]">
        {/* Background Scanline Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#222222_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {/* Ambient Data Cascade Column in Canvas Corner */}
        <div className="absolute top-4 right-4 z-10 hidden sm:block">
          <DataCascade columns={2} rows={10} speedMs={200} />
        </div>

        {/* Vector Schematic SVG Backdrop */}
        <div className="relative w-full max-w-[850px] aspect-[16/10] flex items-center justify-center">
          <VectorSchematics
            type={canvasConfig.schematicType}
            currentTheme={currentTheme}
            anomalySimulated={anomalySimulated}
          />

          {/* Dynamic Thermodynamic Spectrum Heatmap Overlay */}
          <ThermodynamicOverlay
            overlayType={canvasConfig.overlayType || 'thermodynamic'}
            anomalySimulated={anomalySimulated}
          />

          {/* Interactive Hotspot Node Targets */}
          {canvasConfig.nodes.map((node) => {
            const metric = metrics[node.metricKey];
            const isSelected = selectedNode?.id === node.id;
            return (
              <HotspotNode
                key={node.id}
                node={node}
                metric={metric}
                currentTheme={currentTheme}
                isSelected={isSelected}
                onSelectNode={onSelectNode}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Canvas Telemetry Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#0a0a0a] border-t border-[#333333] text-[11px] font-mono-data text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          <span>CANVAS RENDERING: ACTIVE (SVG/CANVAS 60FPS)</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-400">
            COHERENCE FACTOR (Φ):{' '}
            <span className={anomalySimulated ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
              {anomalySimulated ? '0.421' : '0.998'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
