import path from "path";
import fs from "fs";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, limit } from "firebase/firestore";

// Known Brendi & Marketplace identifiers
const BRENDI_STORE_UUID = "af48a2e0-7850-4d49-b2f2-c254c9b5880e";
const IFOOD_MERCHANT_ID = "6ed5af29-ea4c-4282-9d22-171d9ccb8fe6";
const FOOD99_SHOP_ID = "5764608110883508219";
const DEFAULT_WEBHOOK_SECRET = "167c191fbcdea754675e6cfade52d0485f254281c5e34b7401316ceada1fd5fa1dedba512bd46b1f1f51a26915265acd";

// Lazy-initialized Firestore instance for backend
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
      }
    } catch (e: any) {
      console.warn("[BRENDI-WEBHOOK] Error reading firebase-applet-config.json:", e.message);
    }

    if (!firebaseConfig.projectId) {
      firebaseConfig.projectId = "lucro-facil-28aaf";
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
  return dbInstance;
}

// Helper to determine channel from OpenDelivery payload & merchantId
function resolveSalesChannel(merchantId?: string, rawPayload?: any): string {
  const mId = (merchantId || "").trim();
  const salesChannel = String(rawPayload?.salesChannel || rawPayload?.order?.salesChannel || rawPayload?.channel || "").toUpperCase();
  const orderType = String(rawPayload?.orderType || rawPayload?.order?.orderType || rawPayload?.type || rawPayload?.deliveryType || "").toUpperCase();
  const isDelivery = orderType.includes("DELIV") || salesChannel.includes("DELIV") || Boolean(rawPayload?.deliveryAddress || rawPayload?.order?.delivery?.deliveryAddress);

  if (mId === IFOOD_MERCHANT_ID || mId.toLowerCase().includes("ifood") || salesChannel.includes("IFOOD")) {
    return "iFood";
  }

  if (mId === FOOD99_SHOP_ID || mId.toLowerCase().includes("99food") || salesChannel.includes("99FOOD") || salesChannel.includes("99")) {
    return "99Food";
  }

  if (mId === BRENDI_STORE_UUID || mId.toLowerCase().includes("brendi") || salesChannel.includes("BRENDI")) {
    return isDelivery ? "Brendi Delivery" : "Brendi Balcão";
  }

  // Fallbacks based on clues in payload
  if (salesChannel.includes("BALCAO") || salesChannel.includes("INDOOR") || orderType.includes("TAKEOUT") || orderType.includes("DINE_IN")) {
    return "Brendi Balcão";
  }

  return isDelivery ? "Brendi Delivery" : "Brendi Balcão";
}

// Find target store owner userId in Firestore
async function resolveStoreOwnerUserId(db: any, queryUserId?: string): Promise<string> {
  if (queryUserId) return queryUserId;

  try {
    const usersColl = collection(db, "users");
    const snapshot = await getDocs(query(usersColl, limit(20)));
    
    // Look for espacocarreiro@gmail.com first (primary store owner)
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.email?.toLowerCase().trim() === "espacocarreiro@gmail.com") {
        return docSnap.id;
      }
    }

    // Look for admin role
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.role === "admin") {
        return docSnap.id;
      }
    }

    // Fallback to first user
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
  } catch (err: any) {
    console.warn("[BRENDI-WEBHOOK] Could not query users collection:", err.message);
  }

  return "default_store_owner";
}

// Normalize incoming item objects from OpenDelivery specification
function extractItems(rawPayload: any): Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number; notes?: string }> {
  const rawItems = rawPayload?.order?.items || rawPayload?.items || rawPayload?.order?.orderItems || [];
  if (!Array.isArray(rawItems)) return [];

  return rawItems.map((item: any) => {
    const name = String(item.name || item.productName || item.description || item.title || "Produto").trim();
    const quantity = Number(item.quantity || item.qty || item.amount || 1);
    
    let unitPrice = 0;
    if (typeof item.unitPrice === "number") {
      unitPrice = item.unitPrice;
    } else if (item.unitPrice?.value !== undefined) {
      unitPrice = Number(item.unitPrice.value);
    } else if (typeof item.price === "number") {
      unitPrice = item.price;
    } else if (item.price?.value !== undefined) {
      unitPrice = Number(item.price.value);
    } else if (typeof item.totalPrice === "number") {
      unitPrice = item.totalPrice / (quantity || 1);
    }

    let totalPrice = 0;
    if (typeof item.totalPrice === "number") {
      totalPrice = item.totalPrice;
    } else if (item.totalPrice?.value !== undefined) {
      totalPrice = Number(item.totalPrice.value);
    } else {
      totalPrice = unitPrice * quantity;
    }

    return {
      name,
      quantity,
      unitPrice: Number(unitPrice.toFixed(2)),
      totalPrice: Number(totalPrice.toFixed(2)),
      notes: item.notes || item.specialInstructions || undefined
    };
  });
}

// Extract overall order total
function extractTotal(rawPayload: any, items: Array<{ totalPrice: number }>): number {
  const possibleValues = [
    rawPayload?.order?.total?.orderAmount,
    rawPayload?.total?.orderAmount,
    rawPayload?.order?.total?.value,
    rawPayload?.total?.value,
    rawPayload?.order?.orderAmount,
    rawPayload?.orderAmount,
    rawPayload?.order?.totalAmount,
    rawPayload?.totalAmount,
    rawPayload?.order?.total,
    rawPayload?.total
  ];

  for (const v of possibleValues) {
    if (typeof v === "number" && !isNaN(v)) return v;
    if (typeof v === "string" && !isNaN(parseFloat(v))) return parseFloat(v);
  }

  // Calculate sum of items
  return Number(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
}

// Clean undefined fields to avoid Firestore crashes
function cleanUndefined(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        cleaned[key] = cleanUndefined(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
}

// Main Vercel Serverless / Express Handler
export default async function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-webhook-secret, x-hub-signature, x-signature, x-api-key, x-brendi-secret");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ 
      status: "ok", 
      message: "Brendi Webhook Endpoint ativo. Envie requisições POST com os eventos OpenDelivery." 
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // 1. Authenticate Request
  console.log("[BRENDI-WEBHOOK] Headers recebidos na requisição:", JSON.stringify(req.headers));

  const configuredSecret = (process.env.BRENDI_WEBHOOK_SECRET || DEFAULT_WEBHOOK_SECRET).trim();

  // Cabeçalhos verificados para autenticação
  const candidateHeaderValues = [
    req.headers["x-webhook-secret"],
    req.headers["x-hub-signature"],
    req.headers["x-signature"],
    req.headers["authorization"],
    req.headers["x-api-key"],
    // fallbacks adicionais
    req.headers["x-brendi-secret"],
    req.headers["secret"],
    req.query?.secret
  ];

  const matchedHeader = candidateHeaderValues.find((val) => {
    if (!val) return false;
    const strVal = String(val).trim();
    if (strVal === configuredSecret) return true;

    // Trata casos com prefixo (ex: "Bearer <token>", "sha256=<token>", etc)
    const cleaned = strVal
      .replace(/^Bearer\s+/i, "")
      .replace(/^sha256=/i, "")
      .replace(/^sha1=/i, "")
      .trim();

    return cleaned === configuredSecret || strVal.includes(configuredSecret);
  });

  if (!matchedHeader) {
    console.warn("[BRENDI-WEBHOOK] Authentication failed. Invalid webhook secret.");
    return res.status(401).json({ error: "Unauthorized: Chave secreta do webhook inválida ou ausente." });
  }

  console.log("[BRENDI-WEBHOOK] Autenticação bem-sucedida!");

  const payload = req.body || {};
  console.log("[BRENDI-WEBHOOK] Evento recebido com sucesso:", JSON.stringify(payload).slice(0, 300));

  try {
    // 2. OpenDelivery Event Normalization
    // Event code/status can come in: payload.code, payload.event, payload.status, payload.eventType, etc.
    const rawStatus = (
      payload.code || 
      payload.event || 
      payload.status || 
      payload.order?.status || 
      payload.eventType || 
      "CONCLUDED"
    ).toUpperCase();

    const orderId = String(
      payload.orderId || 
      payload.order?.id || 
      payload.id || 
      payload.order?.orderId || 
      payload.eventId || 
      `order_${Date.now()}`
    );

    const merchantId = String(
      payload.merchantId || 
      payload.order?.merchantId || 
      payload.storeId || 
      payload.merchant?.id || 
      BRENDI_STORE_UUID
    );

    const createdAt = 
      payload.createdAt || 
      payload.order?.createdAt || 
      payload.orderTiming?.schedule?.startDateTime || 
      new Date().toISOString();

    const items = extractItems(payload);
    const total = extractTotal(payload, items);
    const channel = resolveSalesChannel(merchantId, payload);

    const customerName = payload.order?.customer?.name || payload.customer?.name || undefined;
    const customerPhone = payload.order?.customer?.phone?.number || payload.customer?.phone || undefined;
    const deliveryType = payload.orderType || payload.order?.orderType || payload.deliveryType || undefined;

    // Filter relevant OpenDelivery statuses
    const validStatuses = [
      "CREATED", "CONFIRMED", "PREPARING", "DISPATCHED", 
      "READY_FOR_PICKUP", "PICKUP_AREA_ASSIGNED", "PICKED_UP", 
      "DELIVERED", "CONCLUDED", "CANCELLED", "CANCELLATION_REQUESTED"
    ];

    const normalizedStatus = validStatuses.includes(rawStatus) ? rawStatus : "CONCLUDED";

    // 3. Save order to Firestore
    const db = getBackendDb();
    const targetUserId = await resolveStoreOwnerUserId(db, req.query?.userId);

    const orderData = cleanUndefined({
      id: orderId,
      orderId,
      createdAt,
      channel,
      merchantId,
      items,
      total,
      status: normalizedStatus,
      customerName,
      customerPhone,
      deliveryType,
      userId: targetUserId,
      receivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Save in user-scoped subcollection: users/{userId}/brendi_orders/{orderId}
    const userOrderRef = doc(db, "users", targetUserId, "brendi_orders", orderId);
    
    // Check for duplication if order is already concluded/delivered
    const existingSnap = await getDoc(userOrderRef);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      // If already recorded with same final status, do not duplicate
      if ((existingData.status === "CONCLUDED" || existingData.status === "DELIVERED") && 
          (normalizedStatus === "CONCLUDED" || normalizedStatus === "DELIVERED")) {
        console.log(`[BRENDI-WEBHOOK] Pedido ${orderId} já existe e está finalizado. Ignorando reenvio duplicado.`);
        return res.status(200).json({ 
          success: true, 
          message: "Pedido já registrado anteriormente", 
          orderId, 
          status: normalizedStatus 
        });
      }
    }

    // Save / update order document
    await setDoc(userOrderRef, orderData, { merge: true });

    // Also persist in root brendi_orders collection as mirror for fast querying & cross-referencing
    try {
      const rootOrderRef = doc(db, "brendi_orders", orderId);
      await setDoc(rootOrderRef, orderData, { merge: true });
    } catch (rootErr) {
      console.warn("[BRENDI-WEBHOOK] Root mirror write warning:", rootErr);
    }

    console.log(`[BRENDI-WEBHOOK] Pedido ${orderId} (${channel}) salvo com sucesso com status ${normalizedStatus} para usuário ${targetUserId}.`);

    return res.status(200).json({ 
      success: true, 
      message: "Evento OpenDelivery processado com sucesso", 
      orderId, 
      channel, 
      status: normalizedStatus 
    });

  } catch (err: any) {
    console.error("[BRENDI-WEBHOOK] Erro ao processar evento:", err);
    // OpenDelivery specification: Always respond with 200 to prevent retry storms if unrecoverable
    return res.status(200).json({ 
      success: false, 
      error: err.message || "Erro interno ao processar pedido" 
    });
  }
}
