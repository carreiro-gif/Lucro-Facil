import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';
import { SalesDataRecord } from '../types';

/**
 * Service to manage the consolidated `sales_data` Firestore collection,
 * serving as the single source of truth for all sales regardless of origin.
 */

// Helper to remove undefined fields before Firestore operations
const cleanData = <T extends Record<string, any>>(obj: T): T => {
  const result: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Save a single sales record to the consolidated `sales_data` collection
 * (and mirror inside user's subcollection for isolated querying and security rules)
 */
export const saveSalesDataRecord = async (record: SalesDataRecord, userId: string): Promise<void> => {
  if (!record.id) return;
  const payload = cleanData({
    ...record,
    userId,
    updatedAt: new Date().toISOString()
  });

  // 1. Root collection
  try {
    const rootRef = doc(db, 'sales_data', record.id);
    await setDoc(rootRef, payload, { merge: true });
  } catch (err) {
    console.warn('[salesDataService] Warning saving to root sales_data:', err);
  }

  // 2. User subcollection
  if (userId) {
    try {
      const userDocRef = doc(db, 'users', userId, 'sales_data', record.id);
      await setDoc(userDocRef, payload, { merge: true });
    } catch (err) {
      console.warn('[salesDataService] Warning saving to user sales_data:', err);
    }
  }
};

/**
 * Save a batch of sales records (batches of 400 to respect Firestore 500 limits)
 */
export const saveSalesDataBatch = async (records: SalesDataRecord[], userId: string): Promise<void> => {
  if (!records || records.length === 0) return;

  const chunkSize = 400;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    chunk.forEach(record => {
      const payload = cleanData({
        ...record,
        userId,
        updatedAt: new Date().toISOString()
      });

      // User subcollection
      if (userId) {
        const userRef = doc(db, 'users', userId, 'sales_data', record.id);
        batch.set(userRef, payload, { merge: true });
      }

      // Root collection
      const rootRef = doc(db, 'sales_data', record.id);
      batch.set(rootRef, payload, { merge: true });
    });

    await batch.commit();
  }
};

/**
 * Retrieve all sales data for a specific reference month (e.g. '2026-09')
 */
export const getSalesDataForMonth = async (userId: string, month: string): Promise<SalesDataRecord[]> => {
  const recordsMap = new Map<string, SalesDataRecord>();

  if (userId) {
    try {
      const userColRef = collection(db, 'users', userId, 'sales_data');
      const q = query(userColRef, where('month', '==', month));
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        recordsMap.set(docSnap.id, docSnap.data() as SalesDataRecord);
      });
    } catch (err) {
      console.warn('[salesDataService] Error querying user sales_data for month:', err);
    }
  }

  // If user subcollection is empty, query root collection
  if (recordsMap.size === 0) {
    try {
      const rootColRef = collection(db, 'sales_data');
      let q = query(rootColRef, where('month', '==', month));
      if (userId) {
        q = query(rootColRef, where('month', '==', month), where('userId', '==', userId));
      }
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        recordsMap.set(docSnap.id, docSnap.data() as SalesDataRecord);
      });
    } catch (err) {
      console.warn('[salesDataService] Fallback query on root sales_data:', err);
    }
  }

  return Array.from(recordsMap.values());
};

/**
 * Delete sales records for a specific month
 */
export const deleteSalesDataByMonth = async (userId: string, month: string): Promise<number> => {
  let count = 0;
  if (!userId || !month) return count;

  try {
    const userColRef = collection(db, 'users', userId, 'sales_data');
    const q = query(userColRef, where('month', '==', month));
    const snap = await getDocs(q);

    const batch = writeBatch(db);
    snap.forEach(d => {
      batch.delete(d.ref);
      // Also delete from root
      const rootRef = doc(db, 'sales_data', d.id);
      batch.delete(rootRef);
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    console.error('[salesDataService] Error deleting sales_data for month:', err);
  }

  return count;
};

/**
 * Complete purge of sales data and brendi orders requested by Admin
 */
export const purgeAllSalesDataAndBrendiOrders = async (userId: string): Promise<{
  brendiCount: number;
  salesCount: number;
}> => {
  let brendiCount = 0;
  let salesCount = 0;

  // 1. Purge user brendi_orders
  if (userId) {
    try {
      const brendiCol = collection(db, 'users', userId, 'brendi_orders');
      const snap = await getDocs(brendiCol);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
        brendiCount++;
      }
    } catch (e) {
      console.warn('Error deleting user brendi_orders:', e);
    }
  }

  // 2. Purge root brendi_orders
  try {
    const rootBrendiCol = collection(db, 'brendi_orders');
    const snap = await getDocs(rootBrendiCol);
    for (const d of snap.docs) {
      const data = d.data();
      // If belongs to user or admin is wiping
      if (!userId || data.userId === userId || !data.userId) {
        await deleteDoc(d.ref);
        brendiCount++;
      }
    }
  } catch (e) {
    console.warn('Error deleting root brendi_orders:', e);
  }

  // 3. Purge user sales_data
  if (userId) {
    try {
      const salesCol = collection(db, 'users', userId, 'sales_data');
      const snap = await getDocs(salesCol);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
        salesCount++;
      }
    } catch (e) {
      console.warn('Error deleting user sales_data:', e);
    }
  }

  // 4. Purge root sales_data
  try {
    const rootSalesCol = collection(db, 'sales_data');
    const snap = await getDocs(rootSalesCol);
    for (const d of snap.docs) {
      const data = d.data();
      if (!userId || data.userId === userId || !data.userId) {
        await deleteDoc(d.ref);
        salesCount++;
      }
    }
  } catch (e) {
    console.warn('Error deleting root sales_data:', e);
  }

  // 5. Clean localStorage caching keys for sales and brendi
  try {
    localStorage.removeItem('lucro_facil_brendi_orders_v1');
    localStorage.removeItem('lucro_facil_be_monthly_orders_v1');
    localStorage.removeItem('brendi_cached_orders');
  } catch (e) {}

  return { brendiCount, salesCount };
};

/**
 * Alias to purge all sales data for user
 */
export const clearAllSalesData = async (userId: string): Promise<void> => {
  await purgeAllSalesDataAndBrendiOrders(userId);
};
