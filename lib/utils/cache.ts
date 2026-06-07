import NodeCache from 'node-cache';

// Cache durations in seconds
export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
};

// Create cache instance
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export interface CacheOptions {
  ttl?: number;
  key: string;
}

/**
 * Get value from cache
 */
export function getFromCache<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

/**
 * Set value in cache
 */
export function setInCache<T>(key: string, value: T, ttl: number = CACHE_DURATIONS.LONG): void {
  cache.set(key, value, ttl);
}

/**
 * Delete from cache
 */
export function deleteFromCache(key: string): void {
  cache.del(key);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.flushAll();
}

/**
 * Get or set cache - wrapper for common pattern
 */
export async function getOrSetCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = CACHE_DURATIONS.LONG
): Promise<T> {
  const cached = getFromCache<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const result = await fn();
  setInCache(key, result, ttl);
  return result;
}

/**
 * Create cache key from parameters
 */
export function createCacheKey(...parts: (string | number | boolean)[]): string {
  return parts.filter(Boolean).join(':');
}
