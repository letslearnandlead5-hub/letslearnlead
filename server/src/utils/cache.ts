/**
 * Lightweight in-memory cache with TTL support.
 * Avoids repeated expensive DB queries for infrequently-changing data.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class MemoryCache {
    private store = new Map<string, CacheEntry<any>>();

    set<T>(key: string, data: T, ttlSeconds: number): void {
        this.store.set(key, {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.data as T;
    }

    invalidate(key: string): void {
        this.store.delete(key);
    }

    /** Invalidate all keys that start with a given prefix */
    invalidatePrefix(prefix: string): void {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }
}

// Singleton cache instance shared across the app
export const cache = new MemoryCache();

// Cache TTL constants (in seconds)
export const TTL = {
    COURSES_LIST: 60,   // Public course list – refresh every 60 s
    SINGLE_COURSE: 120, // Single course detail – refresh every 2 min
};
