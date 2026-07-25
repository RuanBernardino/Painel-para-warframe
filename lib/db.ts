// src/lib/db.ts
const DB_NAME = 'WarframeDropDB';
const DB_VERSION = 1;
const STORE_NAME = 'cache';
const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 horas

export interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB só funciona no cliente.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('[IndexedDB] Erro ao abrir o banco:', (event.target as IDBOpenDBRequest).error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function getDropsCache<T>(key: string): Promise<T | null> {
  if (typeof key !== 'string' || !key.trim() || key === 'undefined' || key === 'null') {
    console.warn(`[IndexedDB] Tentativa de leitura com chave inválida/vazia:`, key);
    return null;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const result = request.result as CacheItem<T> | undefined;
        if (!result) return resolve(null);

        const now = Date.now();
        if (now - result.timestamp > EXPIRATION_TIME) {
          resolve(null);
        } else {
          resolve(result.data);
        }
      };
    });
  } catch (error) {
    console.error(`[IndexedDB] Falha em getDropsCache("${key}"):`, error);
    return null;
  }
}

export async function saveDropsCache<T>(key: string, data: T): Promise<void> {
  if (typeof key !== 'string' || !key.trim() || key === 'undefined' || key === 'null') {
    console.warn(`[IndexedDB] Tentativa de salvamento com chave inválida/vazia:`, key);
    return;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const payload: CacheItem<T> = {
        data,
        timestamp: Date.now(),
      };
      const request = store.put(payload, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error(`[IndexedDB] Falha em saveDropsCache("${key}"):`, error);
  }
}