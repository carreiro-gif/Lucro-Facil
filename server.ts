import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Secure API Route for Xande chat sessions
app.post("/api/chat", async (req, res) => {
  console.log("[XANDE-API] === NOVO ATENDIMENTO DE CHAT INICIADO ===");
  try {
    const { systemInstruction, fullPrompt } = req.body;
    
    console.log("[XANDE-API] Comprimento de systemInstruction:", systemInstruction?.length || 0);
    console.log("[XANDE-API] Comprimento de fullPrompt:", fullPrompt?.length || 0);

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("[XANDE-API] Verificando existência da chave GEMINI_API_KEY no servidor.");
    if (!apiKey) {
      console.error("[XANDE-API] ERRO CRÍTICO: GEMINI_API_KEY não foi encontrada nas variáveis de ambiente do Vercel!");
      res.status(500).json({ 
        error: "Chave do Gemini (GEMINI_API_KEY) não está configurada no servidor Vercel. Por favor, adicione-a nas variáveis de ambiente do seu projeto no menu do Vercel." 
      });
      return;
    } else {
      console.log("[XANDE-API] GEMINI_API_KEY está presente. Tamanho da chave:", apiKey.length);
      console.log("[XANDE-API] Início da chave:", apiKey.substring(0, 8) + "...");
    }

    console.log("[XANDE-API] Inicializando o cliente do GoogleGenAI...");
    // Initialize Gemini safely inside the request handler as mandated by SDK patterns
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    console.log("[XANDE-API] Criando sessão de chat do Gemini utilizando o modelo gema-3.5-flash...");
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    console.log("[XANDE-API] Enviando mensagem e abrindo stream de resposta...");
    const responseStream = await chat.sendMessageStream({ message: fullPrompt });

    console.log("[XANDE-API] Conectado e transmitindo dados em partes...");
    
    // Setup chunked stream headers for immediate real-time rendering
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    let chunkCount = 0;
    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
        chunkCount++;
      }
    }
    console.log(`[XANDE-API] Resposta concluída com sucesso com ${chunkCount} pedaços de dados enviados.`);
    res.end();
  } catch (error: any) {
    console.error("[XANDE-API] ERRO COMPLETO CAPTURADO NO PROXY DO GEMINI:", error);
    if (error.stack) {
      console.error("[XANDE-API] STACK TRACE DO ERRO:", error.stack);
    }
    if (!res.headersSent) {
      res.status(500).json({ 
        error: `Erro ao processar conversa com o Xande: ${error.message || "Erro desconhecido"}` 
      });
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
    const { createServer: createViteServer } = await import("vite");
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
