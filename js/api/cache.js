const DEFAULT_TTL = 10 * 60 * 1000;
const MAX_ENTRIES = 500;

const cache = new Map();
const inFlight = new Map();

function isFresh(entry, now = Date.now()) {
    return now - entry.createdAt < entry.ttl;
}

function trimCache() {
    while (cache.size > MAX_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
    }
}

/**
 * Resolve a request through the shared in-memory API cache.
 *
 * Completed responses are cached for a short session TTL and concurrent
 * requests for the same key share one promise. Failed requests are never
 * cached, so a later attempt can recover normally.
 */
export function cachedRequest(key, loader, ttl = DEFAULT_TTL) {
    if (!key || typeof loader !== 'function') {
        throw new Error('A cache key and loader function are required.');
    }

    const now = Date.now();
    const cached = cache.get(key);

    if (cached) {
        if (isFresh(cached, now)) {
            return Promise.resolve(cached.value);
        }

        cache.delete(key);
    }

    const pending = inFlight.get(key);

    if (pending) {
        return pending;
    }

    const request = Promise.resolve()
        .then(loader)
        .then((value) => {
            cache.set(key, {
                value,
                createdAt: Date.now(),
                ttl
            });

            trimCache();

            return value;
        })
        .finally(() => {
            inFlight.delete(key);
        });

    inFlight.set(key, request);

    return request;
}

/**
 * Clear all completed and in-flight cached API requests.
 */
export function clearApiCache() {
    cache.clear();
    inFlight.clear();
}

/**
 * Small diagnostic helper for development and performance checks.
 */
export function getApiCacheStats() {
    return {
        entries: cache.size,
        inFlight: inFlight.size
    };
}
