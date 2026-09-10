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

// Find target store owner user in Firestore by Store UUID
async function findUserByStoreUuid(
  db: Firestore, 
  storeUuid: string, 
  fallbackQueryUserId?: string
): Promise<{ userId: string; email?: string; webhookSecret?: string; storeUuid?: string } | null> {
  const cleanStoreUuid = (storeUuid || "").trim().toLowerCase();

  // 1. If fallbackQueryUserId is provided, try looking it up directly
  if (fallbackQueryUserId) {
    try {
      const userDoc = await db.collection("users").doc(fallbackQueryUserId).get();
      if (userDoc.exists) {
        const data = userDoc.data() || {};
        return {
          userId: userDoc.id,
          email: data.email,
          webhookSecret: data.integrations?.brendi?.webhookSecret,
          storeUuid: data.integrations?.brendi?.storeUuid || cleanStoreUuid
        };
      }
    } catch (e: any) {
      console.warn("[BRENDI-WEBHOOK] Query by fallbackQueryUserId failed:", e.message);
    }
  }

  if (!cleanStoreUuid) {
    return null;
  }

  // 2. Query users where integrations.brendi.storeUuid == storeUuid
  try {
    const q = await db.collection("users")
      .where("integrations.brendi.storeUuid", "==", storeUuid.trim())
      .limit(1)
      .get();

    if (!q.empty) {
      const docSnap = q.docs[0];
      const data = docSnap.data() || {};
      return {
        userId: docSnap.id,
        email: data.email,
        webhookSecret: data.integrations?.brendi?.webhookSecret,
        storeUuid: data.integrations?.brendi?.storeUuid
      };
    }
  } catch (err: any) {
    console.warn("[BRENDI-WEBHOOK] Direct query on integrations.brendi.storeUuid:", err.message);
  }

  // 3. Scan users collection (Firebase Admin SDK has full read permissions)
  try {
    const snapshot = await db.collection("users").get();
    
    // First pass: match exact or case-insensitive storeUuid in integrations.brendi.storeUuid
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() || {};
      const userStoreUuid = String(data.integrations?.brendi?.storeUuid || "").trim().toLowerCase();
      if (userStoreUuid && userStoreUuid === cleanStoreUuid) {
        return {
          userId: docSnap.id,
          email: data.email,
          webhookSecret: data.integrations?.brendi?.webhookSecret,
          storeUuid: data.integrations?.brendi?.storeUuid
        };
      }
    }

    // Second pass: if storeUuid matches known admin store, check for espacocarreiro@gmail.com
    if (cleanStoreUuid === BRENDI_STORE_UUID.toLowerCase()) {
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() || {};
        if (data.email?.toLowerCase().trim() === "espacocarreiro@gmail.com") {
          return {
            userId: docSnap.id,
            email: data.email,
            webhookSecret: data.integrations?.brendi?.webhookSecret || DEFAULT_WEBHOOK_SECRET,
            storeUuid: BRENDI_STORE_UUID
          };
        }
      }
    }
  } catch (err: any) {
    console.warn("[BRENDI-WEBHOOK] Could not scan users collection:", err.message);
  }

  return null;
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
  console.log("BRENDI EVENTO COMPLETO", JSON.stringify(req.body, null, 2));
  console.log("BRENDI POSSIVEIS IDENTIFICADORES:", {
    "req.body.merchantId": req.body?.merchantId,
    "req.body.storeId": req.body?.storeId,
    "req.body.restaurantId": req.body?.restaurantId,
    "req.body.merchant": req.body?.merchant,
    "req.body.store": req.body?.store,
    "req.body.id": req.body?.id,
    "req.body.storeUuid": req.body?.storeUuid,
    "req.body.order?.merchantId": req.body?.order?.merchantId,
    "req.body.order?.storeId": req.body?.order?.storeId,
    "req.body.order?.restaurantId": req.body?.order?.restaurantId,
    "req.body.order?.merchant": req.body?.order?.merchant,
    "req.body.order?.store": req.body?.order?.store,
    "req.body.order?.id": req.body?.order?.id,
    "req.body.order?.storeUuid": req.body?.order?.storeUuid,
    "req.body.establishmentId": req.body?.establishmentId,
    "req.body.order?.establishmentId": req.body?.order?.establishmentId,
    "req.headers['x-store-id']": req.headers?.["x-store-id"],
    "req.headers['x-merchant-id']": req.headers?.["x-merchant-id"],
    "req.headers['x-brendi-store-id']": req.headers?.["x-brendi-store-id"],
    "req.query": req.query
  });

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
      payload.store?.id || 
      req.query?.storeUuid || 
      req.query?.merchantId || 
      ""
    ).trim();

    // 3. Initialize Firebase Admin SDK & Find the target store owner
    const db = getAdminDb();
    const matchedUser = await findUserByStoreUuid(db, merchantId, req.query?.userId);

    if (!matchedUser) {
      console.warn(`[BRENDI-WEBHOOK] ⚠️ Nenhuma loja encontrada com o Store UUID: "${merchantId}". O pedido ${orderId} foi ignorado.`);
      return res.status(200).json({ 
        success: true, 
        warning: `Nenhuma loja cadastrada com o Store UUID "${merchantId}". Cadastre seu Store UUID na tela de Integrações.`, 
        orderId 
      });
    }

    // 4. Dynamic Security Secret Validation against user's specific credentials
    const expectedSecret = (matchedUser.webhookSecret || "").trim();
    const incomingSecret = (
      req.headers["x-webhook-secret"] ||
      req.headers["x-brendi-secret"] ||
      req.headers["x-api-key"] ||
      req.headers["webhook-secret"] ||
      (req.headers["authorization"] ? String(req.headers["authorization"]).replace(/^Bearer\s+/i, "") : "")
    )?.toString().trim();

    if (expectedSecret && incomingSecret && incomingSecret !== expectedSecret) {
      console.warn(`[BRENDI-WEBHOOK] ❌ Chave secreta do webhook inválida para a loja ${merchantId} (Usuário: ${matchedUser.userId}).`);
      return res.status(401).json({ error: "Chave secreta do webhook inválida" });
    }

    const targetUserId = matchedUser.userId;

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

    // Save directly to user-scoped subcollection: users/{userId}/brendi_orders/{orderId}
    const userOrderRef = db.collection("users").doc(targetUserId).collection("brendi_orders").doc(orderId);
    
    // Check for duplication if order is already concluded/delivered
    const existingSnap = await userOrderRef.get();
    const snapExists = typeof existingSnap.exists === "function" ? (existingSnap as any).exists() : existingSnap.exists;
    if (snapExists) {
      const existingData = existingSnap.data() || {};
      if ((existingData.status === "CONCLUDED" || existingData.status === "DELIVERED") && 
          (normalizedStatus === "CONCLUDED" || normalizedStatus === "DELIVERED")) {
        console.log(`[BRENDI-WEBHOOK] Pedido ${orderId} já existe e está finalizado para o usuário ${targetUserId}. Ignorando reenvio duplicado.`);
        return res.status(200).json({ 
          success: true, 
          message: "Pedido já registrado anteriormente", 
          orderId, 
          status: normalizedStatus 
        });
      }
    }

    // Write to user's subcollection
    await userOrderRef.set(orderData, { merge: true });

    // Also mirror in root brendi_orders collection
    try {
      const rootOrderRef = db.collection("brendi_orders").doc(orderId);
      await rootOrderRef.set(orderData, { merge: true });
    } catch (rootErr: any) {
      console.warn("[BRENDI-WEBHOOK] Root collection mirror warning:", rootErr.message);
    }

    console.log(`[BRENDI-WEBHOOK] ✅ Pedido ${orderId} (${channel}) salvo com sucesso na subcoleção do usuário ${targetUserId} (${matchedUser.email || 'sem email'}).`);

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
