import path from "path";
import fs from "fs";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Known Brendi & Marketplace identifiers
const BRENDI_STORE_UUID = "af48a2e0-7850-4d49-b2f2-c254c9b5880e";
const IFOOD_MERCHANT_ID = "6ed5af29-ea4c-4282-9d22-171d9ccb8fe6";
const FOOD99_SHOP_ID = "5764608110883508219";
const DEFAULT_WEBHOOK_SECRET = "167c191fbcdea754675e6cfade52d0485f254281c5e34b7401316ceada1fd5fa1dedba512bd46b1f1f51a26915265acd";

// Lazy-initialized Firebase Admin Firestore instance
let adminDbInstance: Firestore | null = null;

function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    // 1. Primeiro verifica se o Firebase Admin já foi inicializado para não inicializar duas vezes
    if (getApps().length === 0) {
      const rawSa = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();

      // 2. Segundo tenta ler a variável FIREBASE_SERVICE_ACCOUNT que contém o JSON completo
      if (rawSa && rawSa.length > 0) {
        let saObj: any = null;
        try {
          let cleanSa = rawSa;
          if ((cleanSa.startsWith("'") && cleanSa.endsWith("'")) || (cleanSa.startsWith('"') && cleanSa.endsWith('"') && !cleanSa.endsWith('"}'))) {
            cleanSa = cleanSa.slice(1, -1).trim();
          }
          saObj = JSON.parse(cleanSa);
        } catch (err: any) {
          try {
            const decoded = Buffer.from(rawSa, "base64").toString("utf-8");
            saObj = JSON.parse(decoded);
          } catch (b64Err: any) {
            console.error("[FIREBASE-ADMIN] Falha ao fazer parse de FIREBASE_SERVICE_ACCOUNT:", err.message);
          }
        }

        if (saObj) {
          const privateKey = (saObj.private_key || saObj.privateKey || "").replace(/\\n/g, "\n");
          const clientEmail = saObj.client_email || saObj.clientEmail;
          const projectId = saObj.project_id || saObj.projectId || process.env.FIREBASE_PROJECT_ID || "lucro-facil-28aaf";

          initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
            projectId,
          });
          console.log(`[FIREBASE-ADMIN] ✅ Autenticação realizada com sucesso via método: FIREBASE_SERVICE_ACCOUNT (Projeto: ${projectId}, Client Email: ${clientEmail})`);
        }
      }

      // 3. Se não existir, usa as variáveis individuais FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY
      if (getApps().length === 0) {
        const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "lucro-facil-28aaf").replace(/^["']|["']$/g, "").trim();
        const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").replace(/^["']|["']$/g, "").trim();
        let privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/^["']|["']$/g, "").trim();

        // A FIREBASE_PRIVATE_KEY deve ter os caracteres \n substituídos por quebras de linha reais
        if (privateKey) {
          privateKey = privateKey.replace(/\\n/g, "\n");
        }

        if (clientEmail && privateKey) {
          initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
            projectId,
          });
          console.log(`[FIREBASE-ADMIN] ✅ Autenticação realizada com sucesso via método: VARIÁVEIS INDIVIDUAIS (FIREBASE_PROJECT_ID: ${projectId}, FIREBASE_CLIENT_EMAIL: ${clientEmail})`);
        } else {
          console.error("[FIREBASE-ADMIN] ❌ ATENÇÃO: Nenhuma credencial válida encontrada em FIREBASE_SERVICE_ACCOUNT nem em (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).");
          initializeApp({
            projectId,
          });
          console.log(`[FIREBASE-ADMIN] Inicializado com Application Default Credentials para o projeto: ${projectId}`);
        }
      }
    } else {
      console.log("[FIREBASE-ADMIN] Instância já inicializada anteriormente. Reutilizando app existente.");
    }

    adminDbInstance = getFirestore();
    try {
      adminDbInstance.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Ignora caso já tenha sido configurado
    }
  }

  return adminDbInstance;
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
async function resolveStoreOwnerUserId(db: Firestore, queryUserId?: string): Promise<string> {
  if (queryUserId) return queryUserId;

  try {
    const snapshot = await db.collection("users").limit(20).get();
    
    // Look for espacocarreiro@gmail.com first (primary store owner)
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() || {};
      if (data.email?.toLowerCase().trim() === "espacocarreiro@gmail.com") {
        return docSnap.id;
      }
    }

    // Look for admin role
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() || {};
      if (data.role === "admin") {
        return docSnap.id;
      }
    }

    // Fallback to first user
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
  } catch (err: any) {
    console.warn("[BRENDI-WEBHOOK] Could not query users collection with admin SDK:", err.message);
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

  // Log dos cabeçalhos e corpo conforme solicitado para identificação
  console.log("HEADERS " + JSON.stringify(req.headers));
  console.log("BODY " + JSON.stringify(req.body));

  const payload = req.body || {};

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

    // 3. Save order to Firestore via Firebase Admin SDK
    const db = getAdminDb();
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

    // Save in root brendi_orders collection using Admin SDK
    const rootOrderRef = db.collection("brendi_orders").doc(orderId);
    
    // Check for duplication if order is already concluded/delivered
    const existingSnap = await rootOrderRef.get();
    const snapExists = typeof existingSnap.exists === "function" ? (existingSnap as any).exists() : existingSnap.exists;
    if (snapExists) {
      const existingData = existingSnap.data() || {};
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

    // Save order document in root brendi_orders collection
    await rootOrderRef.set(orderData, { merge: true });

    // Also persist in user-scoped subcollection: users/{userId}/brendi_orders/{orderId}
    if (targetUserId && targetUserId !== "default_store_owner") {
      try {
        const userOrderRef = db.collection("users").doc(targetUserId).collection("brendi_orders").doc(orderId);
        await userOrderRef.set(orderData, { merge: true });
      } catch (subErr: any) {
        console.warn("[BRENDI-WEBHOOK] User subcollection mirror warning:", subErr.message);
      }
    }

    console.log(`[BRENDI-WEBHOOK] Pedido ${orderId} (${channel}) salvo com sucesso na coleção brendi_orders com Firebase Admin SDK para usuário ${targetUserId}.`);

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
