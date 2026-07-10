// In-memory adaptive rate store — tracks attempt counts per key with a sliding window.
const store = new Map();

// Periodic cleanup to prevent unbounded memory growth
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) {
        if (now - v.first > v.window) store.delete(k);
    }
}, 60_000).unref();

/**
 * Increment the attempt counter for a key.
 * Returns true when the count reaches or exceeds the limit (CAPTCHA required).
 */
export function trackAttempt(key, windowMs, limit) {
    const now = Date.now();
    const e = store.get(key);
    if (!e || now - e.first > windowMs) {
        store.set(key, { count: 1, first: now, window: windowMs });
        return false;
    }
    e.count += 1;
    return e.count >= limit;
}

export function resetAttempts(key) {
    store.delete(key);
}
