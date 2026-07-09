import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, updateDoc, setDoc } from "firebase/firestore";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Firestore instance for backend updates
let dbInstance: any = null;

function getBackendDb() {
  if (!dbInstance) {
    let firebaseConfig: any = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID
    };

    let databaseId: string | undefined = undefined;

    // Fallback to loading from firebase-applet-config.json if variables are missing
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, "utf-8");
        const localConfig = JSON.parse(fileContent);
        
        firebaseConfig = {
          apiKey: firebaseConfig.apiKey || localConfig.apiKey,
          authDomain: firebaseConfig.authDomain || localConfig.authDomain,
          projectId: firebaseConfig.projectId || localConfig.projectId,
          storageBucket: firebaseConfig.storageBucket || localConfig.storageBucket,
          messagingSenderId: firebaseConfig.messagingSenderId || localConfig.messagingSenderId,
          appId: firebaseConfig.appId || localConfig.appId
        };
        databaseId = localConfig.firestoreDatabaseId;
        console.log(`[BACKEND-FIREBASE] Loaded config from firebase-applet-config.json successfully. ProjectId: ${firebaseConfig.projectId}, databaseId: ${databaseId}`);
      }
    } catch (e: any) {
      console.warn("[BACKEND-FIREBASE] Failed to load firebase-applet-config.json fallback:", e.message);
    }

    if (!firebaseConfig.projectId) {
      console.warn("[BACKEND-FIREBASE] WARNING: Firebase project ID is not configured in environment variables.");
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    if (databaseId) {
      dbInstance = getFirestore(app, databaseId);
    } else {
      dbInstance = getFirestore(app);
    }
  }
  return dbInstance;
}

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
      console.error("[XANDE-API] ERRO CRÍTICO: GEMINI_API_KEY não foi encontrada nas variáveis de ambiente!");
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

    console.log("[XANDE-API] Criando sessão de chat do Gemini utilizando o modelo gemini-3.5-flash...");
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

// 1. Create Payment Endpoint (Stone / Pagar.me V5)
app.post("/api/create-payment", async (req, res) => {
  const { userId, email, plan, billingCycle } = req.body;
  console.log(`[STONE-API] Solicitação de pagamento para o usuário ${userId}, plano ${plan}, ciclo ${billingCycle}`);

  if (!userId || !plan) {
    res.status(400).json({ error: "Faltando parâmetros userId ou plan" });
    return;
  }

  const billingCycleName = (billingCycle || "monthly").toLowerCase().trim();
  const isYearly = billingCycleName === "yearly";

  const planPrices: Record<string, number> = isYearly ? {
    starter: 29900,
    growth: 49900,
    pro: 59900
  } : {
    starter: 2990,
    growth: 4990,
    pro: 5990
  };

  const planName = plan.toLowerCase().trim();
  const price = planPrices[planName] || (isYearly ? 29900 : 2990);

  const apiKey = process.env.STONE_SECRET_KEY;
  if (!apiKey) {
    console.log("[STONE-API] STONE_SECRET_KEY não configurada. Ativando redirecionamento de simulador.");
    const referer = req.headers.referer || req.headers.origin || "http://localhost:3000";
    const urlObj = new URL(referer);
    urlObj.searchParams.set("simulated_checkout", "true");
    urlObj.searchParams.set("userId", userId);
    urlObj.searchParams.set("plan", planName);
    urlObj.searchParams.set("billingCycle", billingCycleName);
    
    res.json({
      checkout_url: urlObj.toString(),
      is_simulated: true,
      message: "Stone API está em modo de simulação porque STONE_SECRET_KEY não foi configurada."
    });
    return;
  }

  const authHeader = "Basic " + Buffer.from(apiKey + ":").toString("base64");

  const payload = {
    payment_method: "checkout",
    currency: "BRL",
    interval: isYearly ? "year" : "month",
    interval_count: 1,
    customer: {
      name: `Cliente Lucro Fácil - ID ${userId}`,
      email: email || "comercial@lucrofacil.pro",
      type: "individual",
      document: "11111111111"
    },
    items: [
      {
        description: `Assinatura Lucro Fácil - Plano ${plan.toUpperCase()} (${isYearly ? "Anual" : "Mensal"})`,
        pricing_scheme: {
          scheme_type: "flat",
          price: price
        },
        quantity: 1
      }
    ],
    checkout: {
      customer_editable: true,
      payment_methods: ["credit_card", "pix"],
      accepted_multi_payment_methods: [["credit_card"], ["pix"]],
      credit_card: {
        capture: true,
        statement_descriptor: "LUCRO FACIL"
      },
      pix: {
        expires_in: 86400
      },
      success_url: `${req.protocol}://${req.get('host')}/?payment_status=success`,
      skip_checkout_success_page: true
    },
    metadata: {
      userId: userId,
      plan: planName,
      billingCycle: billingCycleName
    }
  };

  try {
    const response = await fetch("https://api.pagar.me/core/v5/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[STONE-API] Erro ao criar assinatura na Pagar.me:", errorBody);
      throw new Error(`Erro na API Pagar.me: ${response.status} - ${errorBody}`);
    }

    const data = await response.json() as any;
    const checkoutUrl = data.checkout_url || (data.checkout && data.checkout.url) || data.payment_link;

    if (!checkoutUrl) {
      console.error("[STONE-API] URL de checkout não encontrada na resposta:", data);
      throw new Error("URL de checkout não gerada pela Pagar.me.");
    }

    res.json({
      checkout_url: checkoutUrl,
      is_simulated: false,
      subscription_id: data.id
    });
  } catch (error: any) {
    console.error("[STONE-API] Exceção ao criar pagamento:", error);
    res.status(500).json({ error: error.message || "Erro interno ao processar assinatura." });
  }
});

// 2. Webhook Endpoint for Stone / Pagar.me events
app.post("/api/stone-webhook", async (req, res) => {
  console.log("[STONE-WEBHOOK] Recebeu evento da Stone/Pagar.me");
  
  try {
    const event = req.body;
    console.log("[STONE-WEBHOOK] Tipo de evento:", event?.type);
    
    const eventType = event?.type;
    if (eventType === "subscription.paid" || eventType === "invoice.paid") {
      const data = event.data;
      const metadata = data?.metadata || data?.subscription?.metadata;
      
      const userId = metadata?.userId;
      const plan = metadata?.plan || "starter";
      const billingCycle = metadata?.billingCycle || "monthly";
      
      console.log(`[STONE-WEBHOOK] Atualizando assinatura para o usuário ${userId}, plano ${plan}, ciclo ${billingCycle}`);
      
      if (userId) {
        const firestoreDb = getBackendDb();
        const userRef = doc(firestoreDb, "users", userId);
        
        const now = new Date();
        const isYearly = billingCycle.toLowerCase().trim() === "yearly";
        const days = isYearly ? 365 : 30;
        const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        
        const maxStoresMap: Record<string, number> = {
          starter: 1,
          growth: 5,
          pro: 999
        };
        const maxStores = maxStoresMap[plan.toLowerCase()] || 1;
        
        await setDoc(userRef, {
          plan: plan.toLowerCase(),
          status: "active",
          planExpiry: expiryDate.toISOString(),
          maxStores: maxStores
        }, { merge: true });
        
        console.log(`[STONE-WEBHOOK] Firestore atualizado com sucesso para o usuário ${userId}!`);
      } else {
        console.warn("[STONE-WEBHOOK] userId não encontrado no metadata do evento.");
      }
    } else {
      console.log(`[STONE-WEBHOOK] Evento ignorado: ${eventType}`);
    }
    
    res.status(200).send("Webhook processado com sucesso");
  } catch (err: any) {
    console.error("[STONE-WEBHOOK] Erro ao processar webhook:", err);
    res.status(500).send("Erro interno ao processar webhook");
  }
});

// 3. Simulated Payment Success Endpoint for developers/testing environments
app.post("/api/simulate-payment-success", async (req, res) => {
  const { userId, plan, billingCycle } = req.body;
  console.log(`[SIMULATOR] Recebida solicitação de faturamento simulado para usuário ${userId}, plano ${plan}, ciclo ${billingCycle}`);
  
  try {
    if (!userId || !plan) {
      res.status(400).json({ error: "Faltando parâmetros userId ou plan" });
      return;
    }
    
    const firestoreDb = getBackendDb();
    const userRef = doc(firestoreDb, "users", userId);
    
    const now = new Date();
    const isYearly = (billingCycle || "").toLowerCase().trim() === "yearly";
    const days = isYearly ? 365 : 30;
    const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const maxStoresMap: Record<string, number> = {
      starter: 1,
      growth: 5,
      pro: 999
    };
    const maxStores = maxStoresMap[plan.toLowerCase()] || 1;
    
    await setDoc(userRef, {
      plan: plan.toLowerCase(),
      status: "active",
      planExpiry: expiryDate.toISOString(),
      maxStores: maxStores
    }, { merge: true });
    
    console.log(`[SIMULATOR] Firestore atualizado com sucesso em modo simulado para o usuário ${userId}!`);
    res.json({ success: true });
  } catch (err: any) {
    console.error("[SIMULATOR] Erro no pagamento simulado:", err);
    res.status(500).json({ error: err.message || "Erro no servidor" });
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
