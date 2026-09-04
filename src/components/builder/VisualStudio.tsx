import React, { useState } from 'react';
import {
  MSDCanvasConfig,
  MSDHeader,
  MSDLayoutManifest,
  MSDNode,
  MetricKey,
  SchematicType,
  ThemeId,
} from '../../types/msd';
import { TEMPLATE_PRESETS } from '../../constants/templates';
import { THEMES } from '../../constants/themes';
import { soundEngine } from '../../utils/audio';
import { CodeExporter } from './CodeExporter';
import { ManifestImporterModal } from './ManifestImporterModal';
import {
  Plus,
  Trash2,
  Sliders,
  Layers,
  Upload,
  RotateCcw,
  Sparkles,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface VisualStudioProps {
  manifest: MSDLayoutManifest;
  onUpdateManifest: (updated: MSDLayoutManifest) => void;
  currentTheme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export const VisualStudio: React.FC<VisualStudioProps> = ({
  manifest,
  onUpdateManifest,
  currentTheme,
  onThemeChange,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  const selectedNode = manifest.msdCanvas.nodes.find((n) => n.id === selectedNodeId);

  // Update header field
  const handleHeaderChange = (field: keyof MSDHeader, val: string) => {
    onUpdateManifest({
      ...manifest,
      header: {
        ...manifest.header,
        [field]: val,
      },
    });
  };

  // Update canvas schematic or overlay
  const handleCanvasConfigChange = (field: keyof MSDCanvasConfig, val: unknown) => {
    onUpdateManifest({
      ...manifest,
      msdCanvas: {
        ...manifest.msdCanvas,
        [field]: val,
      },
    });
  };

  // Add new hotspot node
  const handleAddNode = () => {
    soundEngine.playChime();
    const newId = `node-0${manifest.msdCanvas.nodes.length + 1}`;
    const newNode: MSDNode = {
      id: newId,
      label: 'NEW SYSTEM HOTSPOT',
      x: 50,
      y: 50,
      metricKey: 'coherenceFactor',
      description: 'Operator configured hotspot telemetry node',
      status: 'nominal',
    };

    onUpdateManifest({
      ...manifest,
      msdCanvas: {
        ...manifest.msdCanvas,
        nodes: [...manifest.msdCanvas.nodes, newNode],
      },
    });
    setSelectedNodeId(newId);
  };

  // Delete node
  const handleDeleteNode = (id: string) => {
    soundEngine.playChime();
    onUpdateManifest({
      ...manifest,
      msdCanvas: {
        ...manifest.msdCanvas,
        nodes: manifest.msdCanvas.nodes.filter((n) => n.id !== id),
      },
    });
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  // Update specific node
  const handleUpdateNode = (id: string, updatedFields: Partial<MSDNode>) => {
    onUpdateManifest({
      ...manifest,
      msdCanvas: {
        ...manifest.msdCanvas,
        nodes: manifest.msdCanvas.nodes.map((n) =>
          n.id === id ? { ...n, ...updatedFields } : n
        ),
      },
    });
  };

  // Handle canvas click to place or move node
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    if (selectedNodeId) {
      soundEngine.playBeep(700, 'sine', 0.05);
      handleUpdateNode(selectedNodeId, { x: clickX, y: clickY });
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* Studio Header Bar & Preset Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0a0d12] border-2 border-[#2f3749] rounded-xl shadow-xl">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-400" />
          <div className="font-antonio font-extrabold text-base uppercase text-slate-100 tracking-wider">
            VISUAL LAYOUT STUDIO // SCHEMA ENGINE
          </div>
        </div>

        {/* Preset Layout Loaders */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono-data text-xs text-slate-400">PRESETS:</span>
          {Object.entries(TEMPLATE_PRESETS).map(([key, template]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                soundEngine.playChime();
                onUpdateManifest(template);
                onThemeChange(template.theme);
              }}
              className="px-3 py-1 bg-[#101216] border border-[#2f3749] hover:border-cyan-400 text-xs font-antonio font-bold uppercase text-slate-200 hover:text-cyan-300 rounded cursor-pointer transition-colors"
            >
              {template.name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsImporterOpen(true)}
            className="px-3 py-1 bg-[#1c3c55] border border-[#37a6d1] text-cyan-300 hover:bg-[#2a7193] text-xs font-antonio font-bold uppercase rounded cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5 inline mr-1" />
            IMPORT JSON
          </button>
        </div>
      </div>

      {/* Main Studio Editor Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Configuration Controls */}
        <div className="flex flex-col gap-3 bg-[#0a0d12] p-4 rounded-xl border border-[#2f3749]">
          <div className="font-antonio font-bold text-sm text-cyan-300 uppercase tracking-wider pb-2 border-b border-[#2f3749]">
            01. HEADER & SCHEMA METADATA
          </div>

          <div className="space-y-3 font-mono-data text-xs">
            <div>
              <label className="block text-slate-400 mb-1">LAYOUT ID</label>
              <input
                type="text"
                value={manifest.layoutId}
                onChange={(e) => onUpdateManifest({ ...manifest, layoutId: e.target.value })}
                className="w-full p-2 bg-[#050608] border border-[#2f3749] rounded text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">HEADER TITLE</label>
              <input
                type="text"
                value={manifest.header.title}
                onChange={(e) => handleHeaderChange('title', e.target.value)}
                className="w-full p-2 bg-[#050608] border border-[#2f3749] rounded text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">SUB-TITLE / MODULE</label>
              <input
                type="text"
                value={manifest.header.subTitle || ''}
                onChange={(e) => handleHeaderChange('subTitle', e.target.value)}
                className="w-full p-2 bg-[#050608] border border-[#2f3749] rounded text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">AUTHORIZATION CODE</label>
              <input
                type="text"
                value={manifest.header.authorizationCode}
                onChange={(e) => handleHeaderChange('authorizationCode', e.target.value)}
                className="w-full p-2 bg-[#050608] border border-[#2f3749] rounded text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">SCHEMATIC VECTOR TYPE</label>
              <select
                value={manifest.msdCanvas.schematicType}
                onChange={(e) =>
                  handleCanvasConfigChange('schematicType', e.target.value as SchematicType)
                }
                className="w-full p-2 bg-[#050608] border border-[#2f3749] rounded text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="quantum_core">QUANTUM CORE / WARP REACTOR</option>
                <option value="bridge_command">BRIDGE COMMAND DECK</option>
                <option value="neural_lattice">NEURAL LATTICE SYNTHESIZER</option>
                <option value="thermo_array">THERMODYNAMIC SENSOR ARRAY</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">OVERLAY HEATMAP SPECTRUM</label>
              <select
                value={manifest.msdCanvas.overlayType || 'thermodynamic'}
                onChange={(e) => handleCanvasConfigChange('overlayType', e.target.value)}
                className="w-full p-2 bg-[#050608] border border-[#2f3749] rounded text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="thermodynamic">THERMODYNAMIC ENTROPY</option>
                <option value="coherence">COHERENCE FIELD (Φ)</option>
                <option value="entropy_density">MICROSTATE ENTROPY (ρS)</option>
                <option value="shield_harmonics">SHIELD HARMONICS</option>
                <option value="none">NONE / VECTOR ONLY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Center Column: Visual Drag & Position Canvas Workspace */}
        <div className="lg:col-span-2 flex flex-col gap-3 bg-[#0a0d12] p-4 rounded-xl border border-[#2f3749]">
          <div className="flex items-center justify-between pb-2 border-b border-[#2f3749]">
            <div className="font-antonio font-bold text-sm text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>02. VISUAL CANVAS HOTSPOT PLACEMENT</span>
            </div>

            <button
              type="button"
              onClick={handleAddNode}
              className="px-3 py-1 bg-[#00eeee] text-black font-antonio font-bold text-xs uppercase rounded hover:bg-cyan-300 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 inline mr-1" />
              ADD HOTSPOT NODE
            </button>
          </div>

          <p className="font-mono-data text-xs text-slate-300">
            Click anywhere inside the schematic canvas below to reposition the currently selected hotspot node ({selectedNode?.label || 'Select a node below'}).
          </p>

          {/* Interactive Visual Canvas Container */}
          <div
            onClick={handleCanvasClick}
            className="relative w-full aspect-[16/10] bg-[#050608] rounded-lg border-2 border-dashed border-[#2f3749] overflow-hidden cursor-crosshair group shadow-inner"
          >
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#1c3c55_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

            {/* Render Hotspot Nodes visually */}
            {manifest.msdCanvas.nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              return (
                <div
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEngine.playChime();
                    setSelectedNodeId(node.id);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full font-antonio text-xs font-bold uppercase transition-all cursor-pointer shadow-xl border ${
                    isSelected
                      ? 'bg-cyan-400 text-black border-white scale-125 z-30 ring-4 ring-cyan-500/50'
                      : 'bg-[#101216] text-slate-100 border-cyan-500 hover:scale-110 z-20'
                  }`}
                >
                  {node.label}
                  <span className="ml-1 text-[10px] font-mono-data opacity-75">
                    ({node.x}%, {node.y}%)
                  </span>
                </div>
              );
            })}
          </div>

          {/* Node Inspector & Property Editor */}
          {selectedNode ? (
            <div className="bg-[#101216] p-3 rounded border border-cyan-500/50 space-y-3 font-mono-data text-xs">
              <div className="flex items-center justify-between font-antonio text-sm font-bold text-cyan-300">
                <span>EDIT NODE: {selectedNode.label}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="px-2 py-1 bg-red-950 border border-red-500 text-red-300 hover:bg-red-900 rounded text-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                  DELETE
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">NODE LABEL</label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => handleUpdateNode(selectedNode.id, { label: e.target.value })}
                    className="w-full p-2 bg-[#050608] border border-[#2f3749] rounded text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">METRIC BINDING KEY</label>
                  <select
                    value={selectedNode.metricKey}
                    onChange={(e) =>
                      handleUpdateNode(selectedNode.id, { metricKey: e.target.value as MetricKey })
                    }
                    className="w-full p-2 bg-[#050608] border border-[#2f3749] rounded text-slate-100 cursor-pointer"
                  >
                    <option value="coherenceFactor">COHERENCE FACTOR (Φ)</option>
                    <option value="meanEntropyDensity">ENTROPY DENSITY (ρS)</option>
                    <option value="warpFieldFlux">WARP FIELD FLUX</option>
                    <option value="plasmaFlowRate">PLASMA FLOW RATE</option>
                    <option value="shieldHarmonics">SHIELD HARMONICS</option>
                    <option value="coolantPressure">COOLANT PRESSURE</option>
                    <option value="coreTemperature">CORE TEMPERATURE</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">DESCRIPTION</label>
                  <input
                    type="text"
                    value={selectedNode.description || ''}
                    onChange={(e) =>
                      handleUpdateNode(selectedNode.id, { description: e.target.value })
                    }
                    className="w-full p-2 bg-[#050608] border border-[#2f3749] rounded text-slate-100"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#101216]/50 rounded border border-[#2f3749] text-xs font-mono-data text-slate-400">
              Select any hotspot node on the canvas above to edit its parameters or click "ADD HOTSPOT NODE".
            </div>
          )}
        </div>
      </div>

      {/* Exporter Section */}
      <CodeExporter manifest={manifest} />

      {/* JSON Importer Modal */}
      <ManifestImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportManifest={onUpdateManifest}
      />
    </div>
  );
};
