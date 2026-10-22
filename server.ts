import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function cleanAndParseJson(rawText: string): any {
  if (!rawText) throw new Error("Empty response from AI");
  let text = rawText.trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/i, "").replace(/\s*```$/, "");
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(text);
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI 3D Model Prompt Generator Endpoint
app.post("/api/generate-3d-model", async (req, res) => {
  try {
    const { prompt, category, style } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY not configured. Using client procedural synthesis fallback.",
        fallback: true,
      });
    }

    const systemInstruction = `You are a world-class 3D Parametric CAD and 3D Printing Specialist Engineer.
Your task is to take any user prompt describing a 3D object to manufacture/print (e.g., ergonomic phone stand, hexagonal organizer, headphone desk clamp, dice tower, geometric trophy, custom box with lid, cable organizer, custom bracket, decorative vase, drawer handle, etc.) and generate a precise 3D geometric blueprint composed of solid primitives.

Design Guidelines:
- The 3D model must be manifold (watertight), physically stable, with a flat bottom base resting on the build plate (Y=0).
- Scale: Realistic 3D printable desktop dimensions in millimeters (width/depth 30-180mm, height 20-180mm).
- Primitives available:
  * "box": width (X), height (Y), depth (Z)
  * "cylinder": radiusTop, radiusBottom, height, radialSegments (16-36)
  * "cone": radius, height
  * "sphere": radius
  * "torus": radius (major), tube (minor)
  * "hex-prism": radius, height (6-sided prism)
  * "wedge": width (X), height (Y), depth (Z) - triangular slant prism
  * "tube": radius (outer), wallThickness, height
- Coordinate system:
  * Position [X, Y, Z] in mm. Y is the vertical UP axis.
  * The bottom of the lowest part should be at Y = 0 or centered so the overall model rests stably on the bed (Y >= 0).
  * Rotation [degX, degY, degZ] in degrees.
- Assemble 3 to 14 cohesive components that form the complete, functional, aesthetic object.
- Provide descriptive title and summary in Portuguese.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Generate a complete 3D printable CAD blueprint for: "${prompt}". Category: ${category || "general"}, Style: ${style || "functional"}. Ensure realistic dimensions in mm and stable bed footing.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Descriptive title in Portuguese" },
            description: { type: Type.STRING, description: "1-2 sentence description of design and utility in Portuguese" },
            recommendedSettings: {
              type: Type.OBJECT,
              properties: {
                infill: { type: Type.STRING, description: "e.g. 15-20% Gyroid" },
                layerHeight: { type: Type.STRING, description: "e.g. 0.20mm" },
                supports: { type: Type.STRING, description: "e.g. Não or Sim" },
                filament: { type: Type.STRING, description: "e.g. PLA / PETG" },
              },
            },
            dimensions: {
              type: Type.OBJECT,
              properties: {
                width: { type: Type.NUMBER, description: "Overall width in mm" },
                depth: { type: Type.NUMBER, description: "Overall depth in mm" },
                height: { type: Type.NUMBER, description: "Overall height in mm" },
              },
            },
            components: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "Primitive: 'box' | 'cylinder' | 'cone' | 'sphere' | 'torus' | 'hex-prism' | 'wedge' | 'tube'",
                  },
                  operation: { type: Type.STRING, description: "'add' or 'cut'" },
                  position: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: "[x, y, z] in mm",
                  },
                  rotation: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: "[rotX, rotY, rotZ] in degrees",
                  },
                  dimensions: {
                    type: Type.OBJECT,
                    properties: {
                      width: { type: Type.NUMBER },
                      height: { type: Type.NUMBER },
                      depth: { type: Type.NUMBER },
                      radiusTop: { type: Type.NUMBER },
                      radiusBottom: { type: Type.NUMBER },
                      radialSegments: { type: Type.NUMBER },
                      radius: { type: Type.NUMBER },
                      tube: { type: Type.NUMBER },
                      sides: { type: Type.NUMBER },
                      wallThickness: { type: Type.NUMBER },
                    },
                  },
                  chamfer: { type: Type.NUMBER },
                  color: { type: Type.STRING },
                },
                required: ["type", "position", "dimensions"],
              },
            },
          },
          required: ["title", "description", "components"],
        },
        temperature: 0.7,
      },
    });

    const text = response.text || "{}";
    const parsed = cleanAndParseJson(text);

    return res.json({
      success: true,
      blueprint: parsed,
      model: parsed, // compatibility
    });
  } catch (err: any) {
    console.error("AI 3D Model Generation Error:", err);
    return res.status(500).json({
      error: err.message || "Failed to generate AI 3D model",
      fallback: true,
    });
  }
});

async function startServer() {
  // Vite middleware for development
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`3D Model Studio Server running on http://localhost:${PORT}`);
  });
}

startServer();

