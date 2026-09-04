export type ThemeId = 
  | 'noir-dark'
  | 'quantum-cyan' 
  | 'aegis-amber' 
  | 'hyperion-blue' 
  | 'obsidian-void';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  era: string;
  colors: {
    bgObsidian: string;
    bgSlate: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
    alert: string;
    gold: string;
    live: string;
    text: string;
    textMuted: string;
  };
  archHeaderClass: string;
  elbowClass: string;
  pillboxPrimaryClass: string;
  pillboxSecondaryClass: string;
  glowColor: string;
}

export type MetricKey = 
  | 'coherenceFactor' 
  | 'meanEntropyDensity' 
  | 'warpFieldFlux' 
  | 'plasmaFlowRate' 
  | 'shieldHarmonics' 
  | 'coolantPressure' 
  | 'coreTemperature' 
  | 'subspaceBandwidth';

export interface SystemMetric {
  key: MetricKey;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  nominalRange: [number, number];
  status: 'nominal' | 'warning' | 'critical';
  history: number[];
}

export interface MSDNode {
  id: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  metricKey: MetricKey;
  icon?: string;
  description?: string;
  targetSection?: string;
  status?: 'nominal' | 'warning' | 'critical' | 'standby';
  customValue?: number;
}

export type SchematicType = 
  | 'quantum_core' 
  | 'bridge_command' 
  | 'neural_lattice' 
  | 'thermo_array';

export interface MSDCanvasConfig {
  schematicAsset: string;
  schematicType: SchematicType;
  customSvg?: string;
  nodes: MSDNode[];
  overlayType?: 'none' | 'thermodynamic' | 'coherence' | 'entropy_density' | 'shield_harmonics';
}

export interface MSDHeader {
  title: string;
  authorizationCode: string;
  stardate: string;
  subTitle?: string;
}

export interface MSDNavigationItem {
  id: string;
  label: string;
  target: string;
  active?: boolean;
  color?: string;
}

export interface GeometryParams {
  outerElbowRadius: number;
  innerElbowRadius: number;
  padding: number;
  barGap: number;
}

export interface MSDLayoutManifest {
  $schema: string;
  layoutId: string;
  name?: string;
  theme: ThemeId;
  header: MSDHeader;
  navigation: MSDNavigationItem[];
  msdCanvas: MSDCanvasConfig;
  geometryParams?: GeometryParams;
}

export type AppMode = 'msd-view' | 'ui-builder' | 'token-inspector' | 'ai-diagnostics' | 'voice-control';
