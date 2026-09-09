import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import { WebSocket, WebSocketServer } from "ws";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Helper to sanitize and normalize an extracted theme
  function sanitizeExtractedTheme(raw: any, targetNameHint?: string) {
    const id = raw?.id
      ? String(raw.id).toLowerCase().replace(/[^a-z0-9_-]/g, "-")
      : `theme-${Date.now().toString(36)}`;
    const name = raw?.name || targetNameHint || `Synthesized Theme (${new Date().toLocaleDateString()})`;
    const era = raw?.era || "User Synthesized // Multi-Asset Ingestion";
    const layoutArchetype = raw?.layoutArchetype || "modern-dashboard";
    const borderRadius = raw?.borderRadius || (layoutArchetype === 'modern-dashboard' ? '8px' : layoutArchetype === 'minimalist-grid' ? '6px' : '2px');

    const colors = {
      bgObsidian: raw?.colors?.bgObsidian || "#06080c",
      bgSlate: raw?.colors?.bgSlate || "#0f141e",
      border: raw?.colors?.border || "#2a3447",
      primary: raw?.colors?.primary || "#38bdf8",
      secondary: raw?.colors?.secondary || "#0284c7",
      accent: raw?.colors?.accent || "#00f0ff",
      alert: raw?.colors?.alert || "#ef4444",
      gold: raw?.colors?.gold || "#eab308",
      live: raw?.colors?.live || "#22c55e",
      text: raw?.colors?.text || "#f8fafc",
      textMuted: raw?.colors?.textMuted || "#94a3b8",
    };

    return {
      id,
      name,
      era,
      layoutArchetype,
      borderRadius,
      borderStyle: raw?.borderStyle || "solid",
      colors,
      archHeaderClass:
        raw?.archHeaderClass ||
        `bg-gradient-to-r from-[${colors.primary}] via-[${colors.secondary}] to-[${colors.bgSlate}] text-black`,
      elbowClass: raw?.elbowClass || `bg-[${colors.primary}]`,
      pillboxPrimaryClass:
        raw?.pillboxPrimaryClass || `bg-[${colors.primary}] text-black hover:bg-[${colors.accent}]`,
      pillboxSecondaryClass:
        raw?.pillboxSecondaryClass ||
        `bg-[${colors.bgSlate}] text-[${colors.accent}] hover:bg-[${colors.secondary}] hover:text-white border border-[${colors.border}]`,
      glowColor: raw?.glowColor || "rgba(56, 189, 248, 0.4)",
      fonts: raw?.fonts || {
        display: "Inter, sans-serif",
        mono: "Share Tech Mono, monospace",
        body: "Inter, sans-serif",
      },
      extractedPalette: Array.isArray(raw?.extractedPalette) ? raw.extractedPalette : [],
      designNotes: raw?.designNotes || "Theme successfully synthesized and extrapolated from provided design assets.",
      isCustom: true,
    };
  }

  // Helper to sanitize and normalize an extrapolated page template
  function sanitizeExtractedTemplate(raw: any, themeId: string, templateNameHint?: string) {
    const layoutId = raw?.layoutId || `template-${Date.now().toString(36)}`;
    const name = raw?.name || templateNameHint || "Extrapolated Production Workspace";
    const layoutArchetype = raw?.layoutArchetype || "modern-dashboard";

    const header = {
      title: raw?.header?.title || name.toUpperCase(),
      subTitle: raw?.header?.subTitle || "REAL-TIME TELEMETRY & MULTI-MODULE OPERATIONS WORKSPACE",
      authorizationCode: raw?.header?.authorizationCode || "ENVIRONMENT // PRODUCTION MATRIX",
      stardate: raw?.header?.stardate || "UPTIME: 99.99% // SLA MET",
    };

    const navigation = Array.isArray(raw?.navigation) && raw.navigation.length > 0
      ? raw.navigation
      : [
          { id: "sec-01", label: "01 - OVERVIEW", target: "overview", active: true },
          { id: "sec-02", label: "02 - TELEMETRY", target: "telemetry", active: false },
          { id: "sec-03", label: "03 - SCHEMATIC", target: "schematic", active: false },
          { id: "sec-04", label: "04 - AUDIT LOGS", target: "audit", active: false },
        ];

    const kpiCards = Array.isArray(raw?.kpiCards) && raw.kpiCards.length > 0
      ? raw.kpiCards
      : [
          { id: "kpi-1", label: "SYSTEM EFFICIENCY", value: "98.4%", unit: "Coherence", change: "+4.2%", isPositive: true, metricKey: "coherenceFactor", status: "nominal" },
          { id: "kpi-2", label: "THROUGHPUT VOLUME", value: "48.2 GB/s", unit: "Rate", change: "+12.8%", isPositive: true, metricKey: "plasmaFlowRate", status: "nominal" },
          { id: "kpi-3", label: "ERROR DENSITY", value: "0.012", unit: "Entropy", change: "-18.5%", isPositive: true, metricKey: "meanEntropyDensity", status: "nominal" },
          { id: "kpi-4", label: "THERMAL INDEX", value: "312.4 K", unit: "Temp", change: "Nominal", isPositive: true, metricKey: "coreTemperature", status: "nominal" },
        ];

    const widgets = Array.isArray(raw?.widgets) && raw.widgets.length > 0
      ? raw.widgets
      : [
          { id: "w-1", title: "Real-time Telemetry Vector Stream", type: "metric-chart", colSpan: 2, description: "Dynamic stream analysis and multi-frequency phase alignment" },
          { id: "w-2", title: "Component Health Matrix", type: "data-table", colSpan: 2, description: "Active nodes, operational status, load balancing, and fault tolerances" },
          { id: "w-3", title: "Operational Event Log", type: "event-log", colSpan: 1, description: "System level audit entries and cryptographic state verifications" },
        ];

    const defaultNodes = [
      { id: "node-01", label: "INGESTION MESH", x: 25, y: 30, metricKey: "plasmaFlowRate", description: "Primary ingestion pipeline array", status: "nominal" },
      { id: "node-02", label: "NEURAL COGNITION", x: 75, y: 30, metricKey: "coherenceFactor", description: "Inference calculation tensor core", status: "nominal" },
      { id: "node-03", label: "STORAGE LATENCY", x: 50, y: 70, metricKey: "subspaceBandwidth", description: "Sub-millisecond persistent replication pool", status: "nominal" },
    ];

    const msdCanvas = {
      schematicAsset: raw?.msdCanvas?.schematicAsset || "quantum_core",
      schematicType: raw?.msdCanvas?.schematicType || "quantum_core",
      overlayType: raw?.msdCanvas?.overlayType || "coherence",
      nodes: Array.isArray(raw?.msdCanvas?.nodes) && raw.msdCanvas.nodes.length > 0 ? raw.msdCanvas.nodes : defaultNodes,
    };

    return {
      $schema: "https://mythos.engine/schemas/ui-builder-v1.json",
      layoutId,
      name,
      theme: themeId,
      layoutArchetype,
      header,
      navigation,
      kpiCards,
      widgets,
      msdCanvas,
      geometryParams: {
        outerElbowRadius: 8,
        innerElbowRadius: 4,
        padding: 12,
        barGap: 4,
      },
      designRationale: raw?.designRationale || "Synthesized directly from visual sketch structure, layout hierarchy, and style tokens.",
    };
  }

  // Fallback theme & template generator based on CSS or heuristic presets
  function synthesizeFallbackTemplateAndTheme(params: { cssCode?: string; notes?: string; targetName?: string }) {
    const { cssCode = "", notes = "", targetName } = params;

    // Search for hex codes in provided CSS
    const hexMatches = cssCode.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g) || [];
    const uniqueHexes = Array.from(new Set(hexMatches));

    const primary = uniqueHexes[0] || "#3b82f6";
    const secondary = uniqueHexes[1] || "#1d4ed8";
    const accent = uniqueHexes[2] || "#60a5fa";
    const border = uniqueHexes[3] || "#1e293b";

    // Determine layout archetype from notes
    const lowerNotes = (notes + " " + (targetName || "")).toLowerCase();
    let layoutArchetype: "modern-dashboard" | "tactical-hud" | "aerospace-telemetry" | "terminal-matrix" | "minimalist-grid" = "modern-dashboard";
    if (lowerNotes.includes("terminal") || lowerNotes.includes("cli") || lowerNotes.includes("unix")) {
      layoutArchetype = "terminal-matrix";
    } else if (lowerNotes.includes("aerospace") || lowerNotes.includes("flight") || lowerNotes.includes("orbit")) {
      layoutArchetype = "aerospace-telemetry";
    } else if (lowerNotes.includes("cyber") || lowerNotes.includes("tactical") || lowerNotes.includes("hud")) {
      layoutArchetype = "tactical-hud";
    } else if (lowerNotes.includes("minimal") || lowerNotes.includes("clean") || lowerNotes.includes("mono")) {
      layoutArchetype = "minimalist-grid";
    }

    const name = targetName || (cssCode ? "Extracted Enterprise Stylesheet" : "Synthesized Cloud Dashboard");
    const id = `theme-${Date.now().toString(36)}`;

    const theme = sanitizeExtractedTheme(
      {
        id,
        name,
        era: "Extrapolated Modern Architecture // Multi-Asset Pipeline",
        layoutArchetype,
        colors: {
          bgObsidian: "#090d16",
          bgSlate: "#111827",
          border: border,
          primary: primary,
          secondary: secondary,
          accent: accent,
          alert: "#ef4444",
          gold: "#f59e0b",
          live: "#10b981",
          text: "#f9fafb",
          textMuted: "#9ca3af",
        },
        glowColor: "rgba(59, 130, 246, 0.4)",
        fonts: {
          display: "Inter, sans-serif",
          mono: "Share Tech Mono, monospace",
          body: "Inter, sans-serif",
        },
        extractedPalette: uniqueHexes.map((hex, i) => ({
          hex,
          label: `Extracted Token ${i + 1}`,
          role: i === 0 ? "Primary" : i === 1 ? "Secondary" : "Accent",
        })),
        designNotes: notes || "Extrapolated modern production layout free of legacy Star Trek LCARS curves.",
      },
      name
    );

    const template = sanitizeExtractedTemplate(
      {
        layoutId: `layout-${Date.now().toString(36)}`,
        name: `${name} Layout`,
        layoutArchetype,
        header: {
          title: `${name.toUpperCase()} // OPERATIONS CONSOLE`,
          subTitle: "DISTRIBUTED OBSERVABILITY, LIVE METRIC TELEMETRY, & ACTIVE SYSTEM NODES",
          authorizationCode: "SYSTEM LEVEL: PRODUCTION // CLUSTER US-WEST",
          stardate: "HEALTH: 100% // ALL SERVICES NORMAL",
        },
        navigation: [
          { id: "sec-01", label: "01 - DASHBOARD", target: "dashboard", active: true },
          { id: "sec-02", label: "02 - CLUSTER NODES", target: "nodes", active: false },
          { id: "sec-03", label: "03 - TELEMETRY CHARTS", target: "telemetry", active: false },
          { id: "sec-04", label: "04 - INCIDENT QUEUE", target: "incidents", active: false },
        ],
        kpiCards: [
          { id: "kpi-1", label: "MESH COHERENCE", value: "99.8%", unit: "SLA", change: "+0.4%", isPositive: true, metricKey: "coherenceFactor", status: "nominal" },
          { id: "kpi-2", label: "REQUEST INGRESS", value: "64.2k req/s", unit: "Bandwidth", change: "+8.5%", isPositive: true, metricKey: "plasmaFlowRate", status: "nominal" },
          { id: "kpi-3", label: "ERROR BUDGET DRAIN", value: "0.001%", unit: "Rate", change: "-24.0%", isPositive: true, metricKey: "meanEntropyDensity", status: "nominal" },
          { id: "kpi-4", label: "CPU LATENCY P99", value: "2.8 ms", unit: "Time", change: "Optimal", isPositive: true, metricKey: "coreTemperature", status: "nominal" },
        ],
        widgets: [
          { id: "w-1", title: "Real-time Distributed Ingress Velocity", type: "metric-chart", colSpan: 2, description: "Throughput metrics over 60 second rolling time-window" },
          { id: "w-2", title: "Microservice Node Status Matrix", type: "data-table", colSpan: 2, description: "Active pods, CPU allocations, memory headroom, and error status" },
          { id: "w-3", title: "Audit Event Stream", type: "event-log", colSpan: 1, description: "Synchronous verification records and cluster health heartbeat signals" },
        ],
        designRationale: "Synthesized clean, modern, non-Star Trek page template matching operator specifications.",
      },
      theme.id,
      name
    );

    return { theme, template };
  }

  // Multi-tier model fallback for Gemini API calls to mitigate 503 high demand spikes and rate limits
  interface GeminiGenerateOptions {
    primaryModel?: string;
    fallbackModels?: string[];
    contents: any;
    config?: any;
  }

  async function callGeminiGenerateContentWithFallback(
    ai: GoogleGenAI,
    options: GeminiGenerateOptions
  ): Promise<{ response: any; modelUsed: string }> {
    const candidateModels = [
      options.primaryModel || "gemini-3.8-flash",
      ...(options.fallbackModels || ["gemini-flash-latest", "gemini-3.1-flash-lite"]),
    ];
    const uniqueModels = Array.from(new Set(candidateModels));

    let lastError: unknown = null;

    for (const model of uniqueModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: options.contents,
            config: options.config,
          });
          return { response, modelUsed: model };
        } catch (err: unknown) {
          lastError = err;
          const errMsg = err instanceof Error ? err.message : String(err);
          const isTemporary =
            errMsg.includes("503") ||
            errMsg.includes("UNAVAILABLE") ||
            errMsg.includes("high demand") ||
            errMsg.includes("429") ||
            errMsg.includes("RESOURCE_EXHAUSTED");

          if (isTemporary && attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }
          console.warn(`[Gemini Fallback] Model '${model}' unavailable (${errMsg.slice(0, 100)}...). Trying next candidate model.`);
          break;
        }
      }
    }

    throw lastError;
  }

  // Synthesizes a Department of Defense & U.S. Navy COMMPACK-MIL compliant telemetry diagnostic
  // when the remote Gemini API experiences temporary 503 high demand or network unavailability.
  function synthesizeLocalTelemetryDiagnostic(metrics: any, manifest: any, prompt?: string): string {
    const coherence = typeof metrics?.warpFieldCoherence === "number" ? metrics.warpFieldCoherence : 0.998;
    const plasma = typeof metrics?.plasmaFlowRate === "number" ? metrics.plasmaFlowRate : 85.0;
    const temp = typeof metrics?.coreTemperature === "number" ? metrics.coreTemperature : 3400;
    const entropy = typeof metrics?.subspaceEntropy === "number" ? metrics.subspaceEntropy : 0.042;
    const isSurge = coherence < 0.95 || temp > 4000 || entropy > 0.15;
    const schematic = (manifest?.msdCanvas?.schematicType || "quantum_core").toString().replace(/_/g, " ").toUpperCase();
    const nodeCount = manifest?.msdCanvas?.nodes?.length || 0;

    return `### BLUF (Bottom Line Up Front)
The quantum containment lattice and thermodynamic distribution grid operate ${isSurge ? "under an active anomaly surge requiring tactical stabilization" : "within standard operational limits at nominal coherence"}.

### Operational Telemetry Assessment
- **Warp Field Coherence**: ${(coherence * 100).toFixed(2)}% (tactical threshold: >= 98.00%).
- **Plasma Conduit Flow**: ${plasma.toFixed(1)}% through primary distribution arrays.
- **Thermal Core Temperature**: ${temp} K (thermal margin: ${Math.max(0, 5000 - temp)} K before interlock limit).
- **Subspace Entropy Density**: ${entropy.toFixed(4)} (coherence delta: stable).
- **Active Schematic Subsystem**: ${schematic} with ${nodeCount} telemetry sensors registered.

### Tactical Action Directives
1. The containment field generator must maintain magnetic plasma balance.
2. The cooling manifold will purge excess thermal buildup if core temperature exceeds 4,200 K.
3. System operators may recalibrate subspace harmonic sensors via the Master Systems Display.`;
  }

  // API endpoint for Multimodal Sketch & Asset-to-Theme/Template Transformation
  app.post("/api/theme/transform", async (req, res) => {
    try {
      const { images = [], cssCode = "", notes = "", targetName = "" } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY not set, using heuristic fallback synthesizer.");
        const fallback = synthesizeFallbackTemplateAndTheme({ cssCode, notes, targetName });
        return res.json({ theme: fallback.theme, template: fallback.template, source: "heuristic_fallback" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemInstruction = `You are the MythOS Advanced Design System & Layout Extrapolation Engine.
Your task is to analyze user-provided design inputs—including wireframes, sketches, diagrams, UI mockups, screenshots of real systems, color swatches, font styles, and legacy CSS files.

CRITICAL DIRECTIVE:
DO NOT DEFAULT TO OR FORCE A "STAR TREK" OR "LCARS" LOOK (NO curved elbows, NO LCARS arches, NO Starfleet stardates, NO subspace references) UNLESS the user explicitly demands Star Trek.
Instead, faithfully COPY, SYNTHESIZE, AND EXTRAPOLATE the true visual design, layout archetype, component hierarchy, color palette, and styling from the supplied inputs into:
1. A distinct runtime THEME adhering to modern web design standards.
2. A complete, rich PAGE TEMPLATE (Layout Manifest) that mirrors and extrapolates the actual cards, panels, widgets, navigation, and schematic/canvas seen in the input!

Layout Archetypes to identify:
- "modern-dashboard": Contemporary SaaS/cloud analytics console (clean topbar, clean sidebar or top tabs, KPI metric cards, area charts, data tables, modular cards, clean 6-12px rounded borders).
- "tactical-hud": Sharp, high-contrast avionics HUD or military/cyber operations display (sharp technical borders, target vectors, crosshairs, telemetry logs).
- "aerospace-telemetry": Mission control and flight operations display (sensor grids, flight parameters, trajectory maps, status monitors).
- "terminal-matrix": Developer workstation or UNIX command matrix (monospaced typography, status ribbons, command terminal outputs).
- "minimalist-grid": Ultra-clean, spacious card grid with high typography focus, subtle borders, flat surfaces.

JSON SCHEMA REQUIREMENT:
Return a JSON object with two top-level keys: "theme" and "template".

"theme":
{
  "id": "clean-kebab-id",
  "name": "Descriptive Human Name",
  "era": "Design Lineage / Architecture Subtitle",
  "layoutArchetype": "modern-dashboard" | "tactical-hud" | "aerospace-telemetry" | "terminal-matrix" | "minimalist-grid",
  "borderRadius": "8px" (or "0px" for sharp HUD, "4px" for terminal, "12px" for modern SaaS),
  "borderStyle": "solid",
  "colors": {
    "bgObsidian": "Very dark canvas background hex (#06080c to #0f141d)",
    "bgSlate": "Panel/container background hex (#111827 to #1e293b)",
    "border": "Framing border hex (#1f2937 to #374151)",
    "primary": "Dominant structural accent color extracted from the sketch",
    "secondary": "Secondary harmonious color",
    "accent": "High-visibility highlight color for active states",
    "alert": "Critical alert indicator #ef4444",
    "gold": "Secondary caution #f59e0b",
    "live": "Operational status green #10b981",
    "text": "High contrast primary readout text (WCAG AA legible against bgObsidian)",
    "textMuted": "Subdued secondary text"
  },
  "fonts": {
    "display": "Inter, sans-serif" (or font matching the sketch),
    "mono": "Share Tech Mono, monospace",
    "body": "Inter, sans-serif"
  },
  "extractedPalette": [
    { "hex": "#...", "label": "...", "role": "..." }
  ],
  "designNotes": "2-sentence rationale explaining the synthesis from the input."
}

"template":
{
  "layoutId": "layout-id",
  "name": "Template Title matching sketch",
  "layoutArchetype": "modern-dashboard" | "tactical-hud" | "aerospace-telemetry" | "terminal-matrix" | "minimalist-grid",
  "header": {
    "title": "Clean header title from sketch",
    "subTitle": "Descriptive subtitle",
    "authorizationCode": "Environment / Project Tag",
    "stardate": "Operational Status or Uptime indicator"
  },
  "navigation": [
    { "id": "sec-01", "label": "01 - DASHBOARD", "target": "overview", "active": true },
    { "id": "sec-02", "label": "02 - MONITOR", "target": "monitor", "active": false },
    { "id": "sec-03", "label": "03 - DATA GRID", "target": "datagrid", "active": false }
  ],
  "kpiCards": [
    { "id": "kpi-1", "label": "STAT 1", "value": "12.4k", "unit": "req/s", "change": "+5.2%", "isPositive": true, "metricKey": "plasmaFlowRate", "status": "nominal" },
    { "id": "kpi-2", "label": "STAT 2", "value": "99.9%", "unit": "Availability", "change": "Nominal", "isPositive": true, "metricKey": "coherenceFactor", "status": "nominal" },
    { "id": "kpi-3", "label": "STAT 3", "value": "1.2 ms", "unit": "Latency", "change": "-0.4ms", "isPositive": true, "metricKey: "subspaceBandwidth", "status": "nominal" },
    { "id": "kpi-4", "label": "STAT 4", "value": "42.8 GB", "unit": "Memory", "change": "+1.1%", "isPositive": false, "metricKey: "coreTemperature", "status": "nominal" }
  ],
  "widgets": [
    { "id": "w-1", "title": "Primary Metric Telemetry", "type": "metric-chart", "colSpan": 2, "description": "Dynamic rolling telemetry trend" },
    { "id": "w-2", "title": "Operational Grid & Nodes", "type": "data-table", "colSpan": 2, "description": "Active component table and status health" },
    { "id": "w-3", "title": "Live Activity Stream", "type": "event-log", "colSpan": 1, "description": "Event ledger and security audits" }
  ],
  "msdCanvas": {
    "schematicAsset": "quantum_core",
    "schematicType": "quantum_core",
    "overlayType": "coherence",
    "nodes": [
      { "id": "n-1", "label": "NODE 1", "x": 30, "y": 35, "metricKey": "coherenceFactor", "description": "Primary node" },
      { "id": "n-2", "label": "NODE 2", "x": 70, "y": 35, "metricKey": "plasmaFlowRate", "description": "Secondary node" }
    ]
  },
  "designRationale": "Extrapolated page structure from sketch layout."
}

Return ONLY the valid JSON with keys { "theme": ..., "template": ... }. Do not enclose in backticks.`;

      const contents: any[] = [];

      // Add user uploaded images (sketches, screenshots, swatches)
      if (Array.isArray(images)) {
        for (const img of images) {
          if (img?.data && img?.mimeType) {
            const base64Data = img.data.replace(/^data:[^;]+;base64,/, "");
            contents.push({
              inlineData: {
                data: base64Data,
                mimeType: img.mimeType,
              },
            });
          }
        }
      }

      let textPrompt = `SYNTHESIZE AND EXTRAPOLATE THE ATTACHED ASSETS INTO A NEW RUNTIME THEME AND A FULL PAGE TEMPLATE:\n`;
      textPrompt += `CRITICAL: DO NOT FORCE A STAR TREK / LCARS STYLE. Extrapolate the authentic visual design, layout archetype, and components observed in the input assets.\n`;
      if (targetName) textPrompt += `TARGET WORKSPACE NAME: ${targetName}\n`;
      if (notes) textPrompt += `OPERATOR DIRECTIVES / NOTES: ${notes}\n`;
      if (cssCode) textPrompt += `LEGACY CSS / CODE SWATCHES:\n${cssCode}\n`;
      if (!images.length && !cssCode && !notes) {
        textPrompt += `Synthesize a clean, modern SaaS analytics and telemetry dashboard with high-contrast metrics, KPI cards, and clean typography.\n`;
      }

      contents.push(textPrompt);

      const { response, modelUsed } = await callGeminiGenerateContentWithFallback(ai, {
        primaryModel: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const responseText = response.text || "{}";
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      const themeRaw = parsed.theme || parsed;
      const templateRaw = parsed.template || null;

      const finalTheme = sanitizeExtractedTheme(themeRaw, targetName);
      const finalTemplate = templateRaw
        ? sanitizeExtractedTemplate(templateRaw, finalTheme.id, targetName)
        : sanitizeExtractedTemplate(
            {
              name: finalTheme.name,
              layoutArchetype: finalTheme.layoutArchetype,
            },
            finalTheme.id,
            targetName
          );

      return res.json({ theme: finalTheme, template: finalTemplate, source: `gemini_${modelUsed}` });
    } catch (error: unknown) {
      console.error("Theme & template transformation error:", error);
      const fallback = synthesizeFallbackTemplateAndTheme({
        cssCode: req.body?.cssCode,
        notes: req.body?.notes,
        targetName: req.body?.targetName,
      });
      return res.json({
        theme: fallback.theme,
        template: fallback.template,
        source: "fallback_recovery",
        warning: error instanceof Error ? error.message : "Fallback activated",
      });
    }
  });

  // API endpoint for Gemini Telemetry Diagnostics
  app.post("/api/gemini/analyze", async (req, res) => {
    const { prompt, metrics, manifest } = req.body || {};
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const localDiagnostic = synthesizeLocalTelemetryDiagnostic(metrics, manifest, prompt);
        return res.json({
          analysis: localDiagnostic,
          source: "local_diagnostic_matrix",
          notice: "Local telemetry diagnostic synthesized (GEMINI_API_KEY unconfigured).",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemInstruction = `You are the MythOS Tactical AI Engine for Advanced Aerospace & Quantum Operations.
You analyze Master Systems Display (MSD) telemetry metrics, thermodynamic entropy density, and layout schemas.
You must adhere strictly to the Department of Defense (DoD) & U.S. Navy Operational Communication Standards:
1. BLUF: Begin your assessment with a Bottom Line Up Front sentence stating operational readiness.
2. Active Voice: Write in the active voice. Name the specific subsystem or component taking action.
3. Helping Verbs:
   - Use "must" for mandatory operational actions or constraints.
   - Use "will" for projected system trajectory or scheduled state transitions.
   - Use "may" or "can" for optional or discretionary actions.
   - Do not use "shall".
4. Conciseness: Limit sentences to an average of 20 or fewer words. Limit each sentence to a single thought.
5. Plain Terminology & Anti-MILSPEAK:
   - Use plain, direct words (use "use" instead of "utilize", "before" instead of "prior to", "to" instead of "in order to").
   - Prohibit bureaucratic action filler ("conducts", "performs", "participates in", "prepares to"). State the direct operational action ("recalibrates", "purges", "inspects").
6. Prohibit Redundancies: Prohibit "currently", "presently", "close proximity", and vague spatial pointers like "here".
7. Prohibit Conversational Filler: Prohibit pleasantries, apologies, and marketing hype.
Format your diagnostic report with bold section headers and parallel bullet points.`;

      const userContent = `OPERATOR QUERY: ${prompt || "Perform full system telemetry diagnostic."}

CURRENT METRICS:
${JSON.stringify(metrics || {}, null, 2)}

CURRENT LAYOUT SCHEMATIC:
${JSON.stringify(manifest?.msdCanvas?.schematicType || "quantum_core")}
NODES BOUND: ${manifest?.msdCanvas?.nodes?.length || 0}`;

      try {
        const { response, modelUsed } = await callGeminiGenerateContentWithFallback(ai, {
          primaryModel: "gemini-3.8-flash",
          contents: userContent,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        return res.json({ analysis: response.text, modelUsed, source: "gemini_api" });
      } catch (geminiError: unknown) {
        console.warn("[Gemini Fallback Activated] Gemini API returned temporary demand spike (503) or error. Synthesizing local tactical diagnostic.", geminiError);
        const localDiagnostic = synthesizeLocalTelemetryDiagnostic(metrics, manifest, prompt);
        return res.json({
          analysis: localDiagnostic,
          source: "local_telemetry_matrix_fallback",
          notice: "Gemini model is currently experiencing temporary high demand (503). Local tactical telemetry matrix synthesized this diagnostic.",
        });
      }
    } catch (error: unknown) {
      console.error("Diagnostic endpoint error:", error);
      const localDiagnostic = synthesizeLocalTelemetryDiagnostic(metrics, manifest, prompt);
      return res.json({
        analysis: localDiagnostic,
        source: "local_telemetry_matrix_fallback",
        notice: "Operational failover engaged.",
      });
    }
  });

  // Host Asset Ingestion Endpoint (Local disk, network shares, Z: drive)
  app.get("/api/host/asset", async (req, res) => {
    try {
      const rawPath = String(req.query.path || "");
      if (!rawPath) {
        return res.status(400).json({ error: "No file path provided in query parameter 'path'." });
      }

      // Check if file exists on disk (works on localhost deployment with direct drive access)
      const fileExists = fs.existsSync(rawPath);

      if (fileExists) {
        const stats = fs.statSync(rawPath);
        if (stats.isDirectory()) {
          return res.status(400).json({ error: `Path '${rawPath}' is a directory, not a file.` });
        }

        const ext = path.extname(rawPath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".svg": "image/svg+xml",
          ".webp": "image/webp",
          ".gif": "image/gif",
          ".json": "application/json",
          ".txt": "text/plain",
        };
        const mimeType = mimeTypes[ext] || "application/octet-stream";
        const fileBuffer = fs.readFileSync(rawPath);
        const base64Data = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

        return res.json({
          success: true,
          exists: true,
          simulated: false,
          filePath: rawPath,
          fileName: path.basename(rawPath),
          mimeType,
          sizeBytes: stats.size,
          dataUrl: base64Data,
        });
      }

      // If file does not exist on disk (e.g. running in sandbox preview container where Z: drive is unmounted),
      // generate a tactical synthetic vector graphic showing the requested path and schematic geometry
      const fileName = path.basename(rawPath) || "host_asset.png";
      const sanitizedPath = rawPath.replace(/[<>&"]/g, "");
      const syntheticSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#070c16"/>
            <stop offset="100%" stop-color="#020409"/>
          </linearGradient>
          <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" stroke-width="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGrad)"/>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.6"/>
        <rect x="30" y="30" width="740" height="440" rx="8" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="10 5" opacity="0.8"/>
        
        <!-- Header banner -->
        <rect x="30" y="30" width="740" height="40" fill="#38bdf8" opacity="0.15"/>
        <text x="50" y="55" fill="#38bdf8" font-family="monospace" font-size="14" font-weight="bold">HOST DRIVE ASSET // INGESTED VIA VOICE DISPATCH</text>
        
        <!-- Center Target Graphic -->
        <circle cx="400" cy="250" r="130" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/>
        <circle cx="400" cy="250" r="90" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.9"/>
        <circle cx="400" cy="250" r="6" fill="#22c55e"/>
        <line x1="240" y1="250" x2="560" y2="250" stroke="#38bdf8" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
        <line x1="400" y1="90" x2="400" y2="410" stroke="#38bdf8" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
        
        <!-- Metadata readouts -->
        <text x="50" y="420" fill="#94a3b8" font-family="monospace" font-size="12">PATH: ${sanitizedPath}</text>
        <text x="50" y="440" fill="#38bdf8" font-family="monospace" font-size="12">STATUS: DISPATCHED TO ACTIVE DISPLAY CANVAS</text>
        <text x="500" y="440" fill="#eab308" font-family="monospace" font-size="12">MODE: HOST INGESTION MATRIX</text>
      </svg>`;
      const syntheticBase64 = `data:image/svg+xml;base64,${Buffer.from(syntheticSvg).toString("base64")}`;

      return res.json({
        success: true,
        exists: false,
        simulated: true,
        filePath: rawPath,
        fileName,
        mimeType: "image/svg+xml",
        message: "Drive/path not physically mounted in sandbox container; rendered tactical synthetic vector.",
        dataUrl: syntheticBase64,
      });
    } catch (err: unknown) {
      console.error("[HostAsset] Error processing file path:", err);
      return res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load host asset." });
    }
  });

  // Host Python & System Command Execution Endpoint
  app.post("/api/host/execute-python", async (req, res) => {
    try {
      const { script, args = "", timeoutMs = 5000 } = req.body;
      if (!script) {
        return res.status(400).json({ error: "Missing 'script' in request body." });
      }

      // Check if local Python daemon is running on default port 8000
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        const daemonRes = await fetch("http://localhost:8000/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ script, args }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (daemonRes.ok) {
          const daemonData = await daemonRes.json();
          return res.json({
            success: true,
            source: "python_local_daemon",
            output: daemonData,
          });
        }
      } catch {
        // Fall back to direct local CLI execution
      }

      // Fallback: Execute via local Python CLI subprocess (supporting Windows and POSIX)
      const pyBin = process.platform === "win32" ? "python" : "python3";
      const command = script.endsWith(".py")
        ? `${pyBin} ${script} ${args}`
        : `${pyBin} -c "${script.replace(/"/g, '\\"')}"`;

      exec(command, { timeout: timeoutMs }, (error, stdout, stderr) => {
        if (error) {
          return res.json({
            success: false,
            source: "host_cli",
            command,
            error: error.message,
            stderr,
            stdout,
          });
        }
        return res.json({
          success: true,
          source: "host_cli",
          command,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "Execution failed." });
    }
  });

  // Host Environment Diagnostic Endpoint
  app.get("/api/host/status", async (req, res) => {
    exec("python3 --version || python --version", (pyErr, pyStdout) => {
      res.json({
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pythonVersion: pyErr ? "Not found in PATH" : pyStdout.trim(),
        cwd: process.cwd(),
        drivesSupported: process.platform === "win32" ? ["C:", "D:", "Z:"] : ["/"],
        timestamp: new Date().toISOString(),
      });
    });
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    if (url.pathname === "/api/live-ws") {
      wss.handleUpgrade(request, socket, head, (clientWs) => {
        wss.emit("connection", clientWs, request);
      });
    }
  });

  // Handle WebSocket connection for Gemini Live API
  wss.on("connection", async (clientWs: WebSocket, request: http.IncomingMessage) => {
    const url = new URL(request?.url || "", `http://${request?.headers?.host || "localhost"}`);
    const requestedVoice = url.searchParams.get("voice") || "Charon";
    const allowedVoices = ["Charon", "Kore", "Fenrir", "Puck", "Zephyr"];
    const voiceName = allowedVoices.includes(requestedVoice) ? requestedVoice : "Charon";
    console.log(`[LiveWS] Client connected to Voice Control socket with voice: ${voiceName}`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      clientWs.send(JSON.stringify({
        type: "error",
        error: "GEMINI_API_KEY is not configured in server environment. Reverting to Windows Read Aloud voice engine.",
        tts_fallback: true,
      }));
      clientWs.close();
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction: `You are the attendant VOXCON Agent and Tactical Execution AI for the Master Systems Display (MSD) console.
You take voice input and natural language orders from the operator and execute them immediately using your tools.
Your active vocal persona is ${voiceName}.
When the voice uplink becomes active or when initialized, your first transmission must immediately state: "VOXCON Active. Standing by."
You must adhere strictly to Department of Defense (DoD) & U.S. Navy Operational Communication Standards:
1. BLUF: Begin your acknowledgment with a Bottom Line Up Front statement of the action taken in the first sentence.
2. Active Voice: Speak in the active voice.
3. Helping Verbs:
   - Use "must" for mandatory directives.
   - Use "will" for projected system trajectory or scheduled state transitions.
   - Use "may" or "can" for optional or discretionary actions.
   - Do not use "shall".
4. Conciseness: Limit sentences to an average of 20 or fewer words (1-2 sentences maximum per vocal acknowledgment).
5. Plain Terminology & Anti-MILSPEAK:
   - Use plain, direct words (use "use" instead of "utilize", "before" instead of "prior to", "to" instead of "in order to").
   - Prohibit bureaucratic action filler ("conducts", "performs", "prepares to"). State the direct operational action ("switches", "purges", "recalibrates").
6. Prohibit Redundancies: Prohibit "currently", "presently", "close proximity", and vague words like "here".
7. Prohibit Conversational Filler: Prohibit pleasantries, apologies, and casual chit-chat.
When an operator gives an order (e.g. switch view mode, change theme, change voice persona, induce or reset anomaly surge, select schematic, select node, or recalibrate telemetry):
1. ALWAYS CALL the corresponding tool to execute the order.
2. Acknowledge the execution concisely in a calm, professional tactical tone (1-2 short sentences).
Available modes: 'msd-view', 'ui-builder', 'token-inspector', 'ai-diagnostics', 'voice-control'.
Available themes: 'noir-dark', 'quantum-cyan', 'aegis-amber', 'hyperion-blue', 'obsidian-void'.
Available schematics: 'quantum_core', 'bridge_command', 'neural_lattice', 'thermo_array'.
Available voices: 'Charon', 'Kore', 'Fenrir', 'Puck', 'Zephyr'.
Execute orders decisively without unnecessary disclaimers.`,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "changeVoice",
                  description: "Switch the AI synthesis voice persona.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      voiceName: {
                        type: Type.STRING,
                        description: "Voice persona: 'Charon' | 'Kore' | 'Fenrir' | 'Puck' | 'Zephyr'",
                      },
                    },
                    required: ["voiceName"],
                  },
                },
                {
                  name: "switchMode",
                  description: "Switch the application active workspace mode.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      mode: {
                        type: Type.STRING,
                        description: "Target mode: 'msd-view' | 'ui-builder' | 'token-inspector' | 'ai-diagnostics' | 'voice-control'",
                      },
                    },
                    required: ["mode"],
                  },
                },
                {
                  name: "switchTheme",
                  description: "Change the UI color theme palette.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      themeId: {
                        type: Type.STRING,
                        description: "Theme id: 'noir-dark' | 'quantum-cyan' | 'aegis-amber' | 'hyperion-blue' | 'obsidian-void'",
                      },
                    },
                    required: ["themeId"],
                  },
                },
                {
                  name: "setAnomalySimulation",
                  description: "Induce a surge anomaly alert or reset system to nominal status.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      active: {
                        type: Type.BOOLEAN,
                        description: "True to trigger an anomaly surge, false to reset to nominal.",
                      },
                    },
                    required: ["active"],
                  },
                },
                {
                  name: "selectSchematic",
                  description: "Switch the Master Systems Display schematic diagram.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      schematicType: {
                        type: Type.STRING,
                        description: "Schematic: 'quantum_core' | 'bridge_command' | 'neural_lattice' | 'thermo_array'",
                      },
                    },
                    required: ["schematicType"],
                  },
                },
                {
                  name: "selectSubsystemNode",
                  description: "Focus, inspect, and select a subsystem telemetry hotspot node by label or keyword.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      query: {
                        type: Type.STRING,
                        description: "Search keyword or name (e.g. 'core', 'plasma', 'coil', 'chamber', 'manifold').",
                      },
                    },
                    required: ["query"],
                  },
                },
                {
                  name: "recalibrateSystem",
                  description: "Perform system telemetry re-calibration, purge entropy, and restore field coherence.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {},
                  },
                },
                {
                  name: "loadHostAsset",
                  description: "Load an image, schematic, or file from a local host path or network drive (e.g. 'Z:/folder/image.png' or '/scans/diagram.png') into the active display.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      filePath: {
                        type: Type.STRING,
                        description: "Full or relative path to file on disk or network drive (e.g. 'Z:/missions/sector4/image.png').",
                      },
                      targetSlot: {
                        type: Type.STRING,
                        description: "Display slot: 'schematic' | 'overlay' | 'modal'.",
                      },
                    },
                    required: ["filePath"],
                  },
                },
                {
                  name: "executePythonScript",
                  description: "Execute a Python script or analysis routine on the local host machine or Python network daemon.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      scriptName: {
                        type: Type.STRING,
                        description: "Script name or Python command (e.g. 'ingest_telemetry.py', 'calc_flux.py').",
                      },
                      arguments: {
                        type: Type.STRING,
                        description: "Optional script arguments.",
                      },
                    },
                    required: ["scriptName"],
                  },
                },
                {
                  name: "queryNetworkNode",
                  description: "Query a local network service, port, or cluster node in a Python/LAN environment.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      nodeAddress: {
                        type: Type.STRING,
                        description: "IP address, hostname, or node identifier (e.g. '192.168.1.50', 'cluster-node-1').",
                      },
                      port: {
                        type: Type.NUMBER,
                        description: "Port number (e.g. 8000, 5000).",
                      },
                    },
                    required: ["nodeAddress"],
                  },
                },
              ],
            },
          ],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            // 1. Tool Calls: Execute orders requested by model
            if (message.toolCall?.functionCalls) {
              const responses: any[] = [];
              for (const call of message.toolCall.functionCalls) {
                console.log("[LiveWS] Executing order tool call:", call.name, call.args);
                let callResponse: any = { status: "Order executed successfully." };

                if (call.name === "loadHostAsset") {
                  const rawPath = String((call.args as any)?.filePath || "");
                  callResponse = {
                    status: `Host asset path acknowledged: ${rawPath}. Dispatched to display canvas.`,
                    filePath: rawPath,
                  };
                } else if (call.name === "executePythonScript") {
                  const script = String((call.args as any)?.scriptName || "");
                  callResponse = {
                    status: `Python script invocation dispatched: ${script}.`,
                  };
                } else if (call.name === "queryNetworkNode") {
                  const node = String((call.args as any)?.nodeAddress || "");
                  callResponse = {
                    status: `Network node query sent to ${node}.`,
                  };
                }

                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({
                    type: "command",
                    name: call.name,
                    args: call.args,
                    id: call.id,
                  }));
                }
                responses.push({
                  id: call.id,
                  name: call.name,
                  response: callResponse,
                });
              }
              session.sendToolResponse({ functionResponses: responses });
            }

            // 2. Audio chunks & transcripts from model
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({
                    type: "audio",
                    audio: part.inlineData.data,
                  }));
                }
                if (part.text && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({
                    type: "transcript",
                    role: "model",
                    text: part.text,
                  }));
                }
              }
            }

            // 3. Interrupted
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }
          },
          onclose: () => {
            console.log("[LiveWS] Gemini Live session closed");
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "status", status: "disconnected" }));
            }
          },
          onerror: (err) => {
            console.error("[LiveWS] Gemini Live session error:", err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: "error",
                error: err instanceof Error ? err.message : String(err),
                tts_fallback: true,
              }));
            }
          },
        },
      });

      clientWs.send(JSON.stringify({ type: "status", status: "connected" }));

      // Prompt VOXCON Agent to vocalize activation greeting immediately upon connection (staggered slightly to allow tactical chime to ring)
      setTimeout(() => {
        try {
          session.sendRealtimeInput({
            text: "Uplink connected. Immediately vocalize this exact greeting to the operator: 'VOXCON Active. Standing by.'",
          });
        } catch (greetErr) {
          console.warn("[LiveWS] Failed to dispatch activation greeting trigger:", greetErr);
        }
      }, 180);

      // Forward client audio / text to Live session
      clientWs.on("message", (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type === "audio" && data.audio) {
            session.sendRealtimeInput({
              audio: {
                data: data.audio,
                mimeType: "audio/pcm;rate=16000",
              },
            });
          } else if (data.type === "text" && data.text) {
            session.sendRealtimeInput({
              text: data.text,
            });
          }
        } catch (err) {
          console.error("[LiveWS] Error forwarding input to Live session:", err);
        }
      });

      clientWs.on("close", () => {
        console.log("[LiveWS] Client socket closed, cleaning up Live session");
        session.close();
      });
    } catch (error) {
      console.error("[LiveWS] Failed to connect to Gemini Live:", error);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : "Failed to initialize Live API session.",
          tts_fallback: true,
        }));
        clientWs.close();
      }
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`MythOS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
