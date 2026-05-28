import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini under named parameters as mandated by the SDK instructions.
// Note the User-Agent parameter setup for telemetry.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Secure API Route for Xande chat sessions
app.post("/api/chat", async (req, res) => {
  try {
    const { systemInstruction, fullPrompt } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY environment variable on the server side.");
      res.status(500).json({ error: "Chave do Gemini (GEMINI_API_KEY) não configurada no servidor." });
      return;
    }

    // Create model session with gemini-3.5-flash as the approved text assistant
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const responseStream = await chat.sendMessageStream({ message: fullPrompt });

    // Setup chunked stream headers for immediate real-time rendering
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    res.end();
  } catch (error: any) {
    console.error("Erro no proxy do Gemini:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Erro interno ao processar chat com o Gemini." });
    }
  }
});

// API Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Export app for Vercel Serverless Function support
export default app;

async function startServer() {
  // Vite development middleware vs Static Production routes
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not executing in Vercel environment
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Lucro Fácil Server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}
