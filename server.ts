import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocket, WebSocketServer } from "ws";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for Gemini Telemetry Diagnostics
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const { prompt, metrics, manifest } = req.body;

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
${JSON.stringify(metrics, null, 2)}

CURRENT LAYOUT SCHEMATIC:
${JSON.stringify(manifest?.msdCanvas?.schematicType || "quantum_core")}
NODES BOUND: ${manifest?.msdCanvas?.nodes?.length || 0}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userContent,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({ analysis: response.text });
    } catch (error: unknown) {
      console.error("Gemini API error:", error);
      const msg = error instanceof Error ? error.message : "Failed to execute Gemini telemetry analysis.";
      return res.status(500).json({ error: msg });
    }
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
        error: "GEMINI_API_KEY is not configured in server environment.",
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
          systemInstruction: `You are the MythOS Voice Control & Tactical Execution AI for the Master Systems Display (MSD) console.
You take voice input and natural language orders from the operator and execute them immediately using your tools.
Your active vocal persona is ${voiceName}.
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
                  response: { status: "Order executed successfully." },
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
              }));
            }
          },
        },
      });

      clientWs.send(JSON.stringify({ type: "status", status: "connected" }));

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
