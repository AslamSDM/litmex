// src/lib/createCache.ts
// Simple in-memory cache utility with TTL support

type CacheRecord<T> = {
  value: T;
  expiry: number;
};

type CacheOptions = {
  ttlSeconds: number;
};

export function createCache<T = any>(
  defaultOptions: CacheOptions = { ttlSeconds: 60 }
) {
  const cache = new Map<string, CacheRecord<T>>();

  return {
    get: (key: string): T | undefined => {
      const record = cache.get(key);
      if (!record) {
        return undefined;
      }

      const now = Date.now();
      if (record.expiry < now) {
        cache.delete(key);
        return undefined;
      }

      return record.value;
    },

    set: (key: string, value: T, options?: Partial<CacheOptions>): void => {
      const ttlSeconds = options?.ttlSeconds ?? defaultOptions.ttlSeconds;
      const expiry = Date.now() + ttlSeconds * 1000;

      cache.set(key, { value, expiry });
    },

    delete: (key: string): void => {
      cache.delete(key);
    },

    clear: (): void => {
      cache.clear();
    },

    has: (key: string): boolean => {
      const record = cache.get(key);
      if (!record) {
        return false;
      }

      const now = Date.now();
      if (record.expiry < now) {
        cache.delete(key);
        return false;
      }

      return true;
    },
  };
}

// Create a default cache for presale data with 60s TTL
export const presaleCache = createCache({ ttlSeconds: 60 });
