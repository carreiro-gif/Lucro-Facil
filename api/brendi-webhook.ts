import path from "path";
import fs from "fs";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { PaymentDetail, FeeDetail, BrendiOrder } from "../types";

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

// Token cache for Brendi OpenDelivery API
const brendiTokenCache: { [key: string]: { token: string; expiresAt: number } } = {};

async function getBrendiAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  if (!clientId || !clientSecret) return null;
  const cacheKey = `${clientId}:${clientSecret}`;
  const now = Date.now();
  if (brendiTokenCache[cacheKey] && brendiTokenCache[cacheKey].expiresAt > now + 60000) {
    return brendiTokenCache[cacheKey].token;
  }

  try {
    const res = await fetch("https://api.brendi.com.br/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        grant_type: "client_credentials"
      }).toString()
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[BRENDI-TOKEN] Falha ao obter token (Status ${res.status}):`, errText);
      return null;
    }

    const data: any = await res.json();
    if (data.access_token) {
      const expiresInSec = Number(data.expires_in || 3600);
      brendiTokenCache[cacheKey] = {
        token: data.access_token,
        expiresAt: now + expiresInSec * 1000
      };
      return data.access_token;
    }
  } catch (err: any) {
    console.warn("[BRENDI-TOKEN] Erro na requisição de token OAuth:", err.message);
  }
  return null;
}

async function fetchBrendiOrderDetails(orderUrl: string, token: string): Promise<any | null> {
  if (!orderUrl || !token) return null;
  try {
    const res = await fetch(orderUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[BRENDI-ORDER] Falha ao buscar detalhes do pedido em ${orderUrl} (Status ${res.status}):`, errText);
      return null;
    }

    return await res.json();
  } catch (err: any) {
    console.warn("[BRENDI-ORDER] Erro ao buscar orderURL:", err.message);
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

// Recursively remove sensitive data (credit card PAN, CVV, passwords, secrets, tokens)
export function sanitizeSafePaymentObject(data: any): any {
  if (data === null || data === undefined) return undefined;
  if (typeof data !== "object") {
    // If it's a string looking like a credit card number (13-19 digits), mask it
    if (typeof data === "string" && /\b(?:\d[ -]*?){13,19}\b/.test(data)) {
      return "[MASKED]";
    }
    return data;
  }
  if (Array.isArray(data)) {
    const arr = data.map(sanitizeSafePaymentObject).filter(v => v !== undefined);
    return arr.length > 0 ? arr : undefined;
  }

  const sensitiveKeyRegex = /(card.*num|pan|cvv|cvc|security.*code|password|passwd|secret|token|private)/i;
  const cleaned: Record<string, any> = {};

  for (const [key, val] of Object.entries(data)) {
    if (sensitiveKeyRegex.test(key)) {
      continue;
    }
    const sanitizedVal = sanitizeSafePaymentObject(val);
    if (sanitizedVal !== undefined) {
      cleaned[key] = sanitizedVal;
    }
  }

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

// Extract real payment details from OpenDelivery standard payload
export function extractPayments(rawPayload: any): PaymentDetail[] {
  const paymentsObj = 
    rawPayload?.order?.payments ?? 
    rawPayload?.payments ?? 
    rawPayload?.order?.payment ?? 
    rawPayload?.payment;

  let rawMethods: any[] = [];

  if (Array.isArray(paymentsObj)) {
    rawMethods = paymentsObj;
  } else if (Array.isArray(paymentsObj?.methods)) {
    rawMethods = paymentsObj.methods;
  } else if (Array.isArray(paymentsObj?.payments)) {
    rawMethods = paymentsObj.payments;
  } else if (paymentsObj && typeof paymentsObj === "object") {
    if (paymentsObj.method || paymentsObj.value !== undefined || paymentsObj.amount !== undefined || paymentsObj.type) {
      rawMethods = [paymentsObj];
    }
  }

  // Fallback: check top-level or order-level paymentMethod string
  if (rawMethods.length === 0) {
    const singleMethod = rawPayload?.order?.paymentMethod || rawPayload?.paymentMethod;
    if (singleMethod && typeof singleMethod === "string") {
      const singleAmount = rawPayload?.order?.total?.orderAmount ?? rawPayload?.total?.orderAmount ?? rawPayload?.total ?? undefined;
      const singleType = rawPayload?.order?.paymentType || rawPayload?.paymentType || undefined;
      rawMethods = [{
        method: singleMethod,
        value: typeof singleAmount === "number" ? singleAmount : undefined,
        type: singleType
      }];
    }
  }

  const results: PaymentDetail[] = [];

  for (const m of rawMethods) {
    if (!m || typeof m !== "object") continue;

    // Amount: value, amount, prepaid, pending, total
    let amount: number | undefined = undefined;
    if (typeof m.value === "number" && !isNaN(m.value)) {
      amount = m.value;
    } else if (typeof m.amount === "number" && !isNaN(m.amount)) {
      amount = m.amount;
    } else if (typeof m.prepaid === "number" && !isNaN(m.prepaid) && m.prepaid > 0) {
      amount = m.prepaid;
    } else if (typeof m.pending === "number" && !isNaN(m.pending) && m.pending > 0) {
      amount = m.pending;
    } else if (typeof m.total === "number" && !isNaN(m.total)) {
      amount = m.total;
    } else if (typeof m.value === "string" && !isNaN(parseFloat(m.value))) {
      amount = parseFloat(m.value);
    } else if (typeof m.amount === "string" && !isNaN(parseFloat(m.amount))) {
      amount = parseFloat(m.amount);
    }

    if (amount !== undefined) {
      amount = Number(amount.toFixed(2));
    }

    // Method name (e.g. CREDIT, DEBIT, PIX, CASH, VOUCHER)
    const rawMethodStr = m.method || m.name || m.paymentMethod || m.code || undefined;
    let method: string | undefined = undefined;
    if (rawMethodStr) {
      method = String(rawMethodStr).trim().toUpperCase();
    }

    // Payment Type: ONLINE, OFFLINE, PREPAID, PENDING
    let type: string | undefined = undefined;
    if (m.type || m.paymentType || m.mode) {
      type = String(m.type || m.paymentType || m.mode).trim().toUpperCase();
    } else if (m.prepaid !== undefined) {
      type = m.prepaid > 0 ? "ONLINE" : "OFFLINE";
    }

    // Transaction ID / Authorization
    const transactionId = m.transactionId || m.authorizationCode || m.tid || m.nsu || undefined;

    // Provider / Acquirer
    const provider = m.provider || m.acquirer || m.issuer || m.card?.acquirer || undefined;

    // Card brand if present (e.g. VISA, MASTERCARD) - metadata only, not sensitive
    const brand = m.card?.brand || m.brand || undefined;

    // Change for cash (troco)
    let changeFor: number | undefined = undefined;
    const rawChange = m.cash?.changeFor ?? m.changeFor;
    if (typeof rawChange === "number" && !isNaN(rawChange)) {
      changeFor = Number(rawChange.toFixed(2));
    } else if (typeof rawChange === "string" && !isNaN(parseFloat(rawChange))) {
      changeFor = Number(parseFloat(rawChange).toFixed(2));
    }

    // Paid At timestamp
    const paidAt = m.paidAt || m.date || undefined;

    // Only add if at least method or amount is defined
    if (method !== undefined || amount !== undefined) {
      const detail: PaymentDetail = {};
      if (amount !== undefined) detail.amount = amount;
      if (method !== undefined) detail.method = method;
      if (type !== undefined) detail.type = type;
      if (transactionId) detail.transactionId = String(transactionId);
      if (provider) detail.provider = String(provider);
      if (paidAt) detail.paidAt = String(paidAt);
      if (rawMethodStr) detail.rawMethod = String(rawMethodStr);
      if (brand) detail.brand = String(brand).toUpperCase();
      if (changeFor !== undefined) detail.changeFor = changeFor;

      results.push(detail);
    }
  }

  return results;
}

// Extract real discount and coupon information from payload
export function extractDiscounts(rawPayload: any): { discountAmount?: number; couponAmount?: number; hasCoupon?: boolean } {
  let discountAmount: number | undefined = undefined;

  const rawDiscount = 
    rawPayload?.order?.total?.discount ?? 
    rawPayload?.total?.discount ?? 
    rawPayload?.order?.discount ?? 
    rawPayload?.discount;

  if (typeof rawDiscount === "number" && !isNaN(rawDiscount) && rawDiscount > 0) {
    discountAmount = Number(rawDiscount.toFixed(2));
  } else if (typeof rawDiscount === "string" && !isNaN(parseFloat(rawDiscount)) && parseFloat(rawDiscount) > 0) {
    discountAmount = Number(parseFloat(rawDiscount).toFixed(2));
  }

  // Check discounts array if available
  const rawDiscounts = rawPayload?.order?.discounts || rawPayload?.discounts;
  if (discountAmount === undefined && Array.isArray(rawDiscounts) && rawDiscounts.length > 0) {
    const sum = rawDiscounts.reduce((acc: number, d: any) => {
      const val = typeof d?.amount === "number" ? d.amount : typeof d?.value === "number" ? d.value : 0;
      return acc + val;
    }, 0);
    if (sum > 0) {
      discountAmount = Number(sum.toFixed(2));
    }
  }

  // Specific Coupon field
  let couponAmount: number | undefined = undefined;
  const rawCoupon = 
    rawPayload?.order?.couponAmount ?? 
    rawPayload?.couponAmount ?? 
    rawPayload?.order?.coupon?.value ?? 
    rawPayload?.order?.coupon?.amount ?? 
    (typeof rawPayload?.order?.coupon === "number" ? rawPayload?.order?.coupon : undefined) ??
    (typeof rawPayload?.coupon === "number" ? rawPayload?.coupon : undefined);

  if (typeof rawCoupon === "number" && !isNaN(rawCoupon) && rawCoupon > 0) {
    couponAmount = Number(rawCoupon.toFixed(2));
  } else if (typeof rawCoupon === "string" && !isNaN(parseFloat(rawCoupon)) && parseFloat(rawCoupon) > 0) {
    couponAmount = Number(parseFloat(rawCoupon).toFixed(2));
  }

  // Check benefits if OpenDelivery uses benefits for coupons
  const rawBenefits = rawPayload?.order?.benefits || rawPayload?.benefits;
  if (couponAmount === undefined && Array.isArray(rawBenefits)) {
    const couponBenefit = rawBenefits.find((b: any) => 
      String(b.target || b.type || "").toUpperCase().includes("COUPON") || 
      String(b.name || "").toUpperCase().includes("CUPOM")
    );
    if (couponBenefit) {
      const bVal = typeof couponBenefit.value === "number" ? couponBenefit.value : typeof couponBenefit.amount === "number" ? couponBenefit.amount : 0;
      if (bVal > 0) {
        couponAmount = Number(bVal.toFixed(2));
      }
    }
  }

  const hasCoupon = couponAmount !== undefined && couponAmount > 0 
    ? true 
    : Boolean(rawPayload?.hasCoupon || rawPayload?.order?.hasCoupon || undefined);

  return {
    discountAmount,
    couponAmount,
    hasCoupon: hasCoupon ? true : undefined
  };
}

// Extract real fees present in the OpenDelivery payload
export function extractFees(rawPayload: any): { fees: FeeDetail[]; deliveryFee?: number; serviceFee?: number } {
  const fees: FeeDetail[] = [];

  // 1. Delivery Fee
  let deliveryFee: number | undefined = undefined;
  const rawDelivery = 
    rawPayload?.order?.total?.deliveryFee ?? 
    rawPayload?.total?.deliveryFee ?? 
    rawPayload?.order?.deliveryFee ?? 
    rawPayload?.deliveryFee;

  if (typeof rawDelivery === "number" && !isNaN(rawDelivery) && rawDelivery >= 0) {
    deliveryFee = Number(rawDelivery.toFixed(2));
  } else if (typeof rawDelivery === "string" && !isNaN(parseFloat(rawDelivery)) && parseFloat(rawDelivery) >= 0) {
    deliveryFee = Number(parseFloat(rawDelivery).toFixed(2));
  }

  if (deliveryFee !== undefined && deliveryFee > 0) {
    fees.push({
      type: "deliveryFee",
      amount: deliveryFee,
      sourceType: "real",
      description: "Taxa de entrega registrada no pedido"
    });
  }

  // 2. Service Fee
  let serviceFee: number | undefined = undefined;
  const rawService = 
    rawPayload?.order?.total?.serviceFee ?? 
    rawPayload?.total?.serviceFee ?? 
    rawPayload?.order?.serviceFee ?? 
    rawPayload?.serviceFee ?? 
    rawPayload?.order?.total?.additionalFees;

  if (typeof rawService === "number" && !isNaN(rawService) && rawService >= 0) {
    serviceFee = Number(rawService.toFixed(2));
  } else if (typeof rawService === "string" && !isNaN(parseFloat(rawService)) && parseFloat(rawService) >= 0) {
    serviceFee = Number(parseFloat(rawService).toFixed(2));
  }

  if (serviceFee !== undefined && serviceFee > 0) {
    fees.push({
      type: "serviceFee",
      amount: serviceFee,
      sourceType: "real",
      description: "Taxa de serviço registrada no pedido"
    });
  }

  // 3. Explicit fees array in payload (e.g. fees: [...])
  const rawFees = rawPayload?.order?.fees || rawPayload?.fees;
  if (Array.isArray(rawFees)) {
    for (const f of rawFees) {
      if (!f || typeof f !== "object") continue;
      const amount = typeof f.amount === "number" ? f.amount : typeof f.value === "number" ? f.value : undefined;
      if (amount !== undefined && !isNaN(amount)) {
        fees.push({
          type: String(f.type || f.name || "fee"),
          amount: Number(amount.toFixed(2)),
          percentage: typeof f.percentage === "number" ? f.percentage : undefined,
          sourceType: "real",
          description: f.description || f.name || undefined
        });
      }
    }
  }

  // 4. Specific platform fee / commission / marketplaceFee if explicitly present in payload
  const rawMarketplaceFee = rawPayload?.order?.marketplaceFee ?? rawPayload?.marketplaceFee;
  if (typeof rawMarketplaceFee === "number" && !isNaN(rawMarketplaceFee) && rawMarketplaceFee > 0) {
    fees.push({
      type: "marketplaceFee",
      amount: Number(rawMarketplaceFee.toFixed(2)),
      sourceType: "real",
      description: "Taxa de marketplace enviada pela plataforma"
    });
  }

  const rawCommission = rawPayload?.order?.commission ?? rawPayload?.commission;
  if (typeof rawCommission === "number" && !isNaN(rawCommission) && rawCommission > 0) {
    fees.push({
      type: "commission",
      amount: Number(rawCommission.toFixed(2)),
      sourceType: "real",
      description: "Comissão da plataforma enviada no pedido"
    });
  }

  const rawPlatformFee = rawPayload?.order?.platformFee ?? rawPayload?.platformFee;
  if (typeof rawPlatformFee === "number" && !isNaN(rawPlatformFee) && rawPlatformFee > 0) {
    fees.push({
      type: "platformFee",
      amount: Number(rawPlatformFee.toFixed(2)),
      sourceType: "real",
      description: "Taxa da plataforma enviada no pedido"
    });
  }

  return { fees, deliveryFee, serviceFee };
}

// Extract subtotal if available or sum from items
export function extractSubtotal(rawPayload: any, items: Array<{ totalPrice: number }>): number | undefined {
  const possibleSubtotals = [
    rawPayload?.order?.total?.itemsPrice,
    rawPayload?.total?.itemsPrice,
    rawPayload?.order?.total?.subTotal,
    rawPayload?.total?.subTotal,
    rawPayload?.order?.subTotal,
    rawPayload?.subTotal,
    rawPayload?.subtotal
  ];

  for (const v of possibleSubtotals) {
    if (typeof v === "number" && !isNaN(v)) return Number(v.toFixed(2));
    if (typeof v === "string" && !isNaN(parseFloat(v))) return Number(parseFloat(v).toFixed(2));
  }

  if (items.length > 0) {
    const sum = items.reduce((s, it) => s + (it.totalPrice || 0), 0);
    return Number(sum.toFixed(2));
  }

  return undefined;
}

// Preserve safe raw payment metadata without sensitive information
export function extractSafeRawPaymentData(rawPayload: any): any {
  const rawPayments = 
    rawPayload?.order?.payments ?? 
    rawPayload?.payments ?? 
    rawPayload?.order?.payment ?? 
    rawPayload?.payment;

  if (rawPayments && typeof rawPayments === "object") {
    return sanitizeSafePaymentObject(rawPayments);
  }

  return undefined;
}

// Clean undefined fields to avoid Firestore crashes
export function cleanUndefined(obj: any): any {
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
      payload.virtualBrand || 
      req.headers["x-app-merchantid"] ||
      req.headers["x-brendi-store-id"] ||
      payload.merchantId || 
      payload.storeId || 
      payload.order?.merchantId || 
      payload.order?.storeId || 
      payload.merchant?.id || 
      payload.store?.id || 
      payload.order?.merchant?.id ||
      payload.order?.store?.id ||
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

    let workingPayload = payload;
    let items = extractItems(workingPayload);
    let total = extractTotal(workingPayload, items);

    // If payload is an OpenDelivery notification event with orderURL and no embedded items, fetch full order
    if (payload.orderURL && items.length === 0) {
      const clientId = matchedUser.storeUuid || merchantId;
      const clientSecret = matchedUser.webhookSecret || DEFAULT_WEBHOOK_SECRET;

      console.log(`[BRENDI-WEBHOOK] 🔄 Buscando detalhes completos do pedido ${orderId} na API Brendi (${payload.orderURL})...`);
      const token = await getBrendiAccessToken(clientId, clientSecret);
      if (token) {
        const fullOrder = await fetchBrendiOrderDetails(payload.orderURL, token);
        if (fullOrder) {
          console.log(`[BRENDI-WEBHOOK] ✅ Detalhes do pedido ${orderId} recebidos: ${fullOrder.items?.length || 0} itens, canal: ${fullOrder.salesChannel || fullOrder.type}`);
          workingPayload = { ...payload, ...fullOrder, order: fullOrder };
          items = extractItems(workingPayload);
          total = extractTotal(workingPayload, items);
        }
      }
    }

    const createdAt = 
      workingPayload.createdAt || 
      workingPayload.order?.createdAt || 
      workingPayload.orderTiming?.schedule?.startDateTime || 
      new Date().toISOString();

    const channel = resolveSalesChannel(merchantId, workingPayload);

    const customerName = workingPayload.order?.customer?.name || workingPayload.customer?.name || undefined;
    const customerPhone = workingPayload.order?.customer?.phone?.number || workingPayload.customer?.phone || undefined;
    const deliveryType = workingPayload.orderType || workingPayload.order?.orderType || workingPayload.type || workingPayload.deliveryType || undefined;
    const displayId = workingPayload.displayId || workingPayload.order?.displayId || undefined;

    // Filter relevant OpenDelivery statuses
    const validStatuses = [
      "CREATED", "CONFIRMED", "PREPARING", "DISPATCHED", 
      "READY_FOR_PICKUP", "PICKUP_AREA_ASSIGNED", "PICKED_UP", 
      "DELIVERED", "CONCLUDED", "CANCELLED", "CANCELLATION_REQUESTED"
    ];

    const normalizedStatus = validStatuses.includes(rawStatus) ? rawStatus : "CONCLUDED";

    const payments = extractPayments(workingPayload);
    const { discountAmount, couponAmount, hasCoupon } = extractDiscounts(workingPayload);
    const { fees, deliveryFee, serviceFee } = extractFees(workingPayload);
    const subtotal = extractSubtotal(workingPayload, items);
    const rawPaymentData = extractSafeRawPaymentData(workingPayload);

    const orderData = cleanUndefined({
      id: orderId,
      orderId,
      displayId,
      createdAt,
      channel,
      merchantId,
      items,
      total,
      subtotal,
      deliveryFee,
      serviceFee,
      discountAmount,
      hasCoupon,
      couponAmount,
      payments: payments.length > 0 ? payments : undefined,
      fees: fees.length > 0 ? fees : undefined,
      rawPaymentData,
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
      const isConcludedOrDelivered = 
        (existingData.status === "CONCLUDED" || existingData.status === "DELIVERED") && 
        (normalizedStatus === "CONCLUDED" || normalizedStatus === "DELIVERED");

      if (isConcludedOrDelivered) {
        // If order already exists, check if incoming payload has missing financial data to update
        const hasMissingPayments = orderData.payments && (!existingData.payments || existingData.payments.length === 0);
        const hasMissingFees = orderData.fees && (!existingData.fees || existingData.fees.length === 0);
        const hasMissingDiscount = orderData.discountAmount !== undefined && existingData.discountAmount === undefined;
        const hasMissingDeliveryFee = orderData.deliveryFee !== undefined && existingData.deliveryFee === undefined;

        if (hasMissingPayments || hasMissingFees || hasMissingDiscount || hasMissingDeliveryFee) {
          console.log(`[BRENDI-WEBHOOK] Pedido ${orderId} já finalizado recebeu dados financeiros adicionais. Atualizando campos.`);
          await userOrderRef.set(orderData, { merge: true });
          try {
            const rootOrderRef = db.collection("brendi_orders").doc(orderId);
            await rootOrderRef.set(orderData, { merge: true });
          } catch (rootErr: any) {
            console.warn("[BRENDI-WEBHOOK] Root collection mirror warning:", rootErr.message);
          }
          return res.status(200).json({ 
            success: true, 
            message: "Pedido existente atualizado com novas informações financeiras", 
            orderId, 
            status: normalizedStatus 
          });
        }

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
