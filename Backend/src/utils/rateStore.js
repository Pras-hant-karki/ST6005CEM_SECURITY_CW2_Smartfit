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

// Tracks how many times an IP has triggered an account lockout (5 failed
// logins) across any account, within a rolling window. Separate from
// trackAttempt()'s CAPTCHA trigger — this one feeds isIpBlocked() below.
const lockoutsByIp = new Map();

// IPs currently under a temporary block, keyed by IP -> unblock timestamp.
const blockedIps = new Map();

setInterval(() => {
    const now = Date.now();
    for (const [k, v] of lockoutsByIp) {
        if (now - v.first > v.window) lockoutsByIp.delete(k);
    }
    for (const [k, until] of blockedIps) {
        if (now > until) blockedIps.delete(k);
    }
}, 60_000).unref();

/**
 * Records that an IP was responsible for one more account lockout.
 * Returns true once the IP has caused `limit` lockouts within `windowMs`.
 */
export function trackLockout(ip, windowMs = 24 * 60 * 60 * 1000, limit = 5) {
    if (!ip) return false;
    const now = Date.now();
    const e = lockoutsByIp.get(ip);
    if (!e || now - e.first > windowMs) {
        lockoutsByIp.set(ip, { count: 1, first: now, window: windowMs });
        return false;
    }
    e.count += 1;
    return e.count >= limit;
}

export function blockIp(ip, durationMs = 60 * 60 * 1000) {
    if (!ip) return;
    blockedIps.set(ip, Date.now() + durationMs);
}

export function isIpBlocked(ip) {
    if (!ip) return false;
    const until = blockedIps.get(ip);
    if (!until) return false;
    if (Date.now() > until) {
        blockedIps.delete(ip);
        return false;
    }
    return true;
}

// Security-alert email suppression — at most one email per (event, source)
// pair within the window, so a sustained attack produces one notification
// instead of a flood. The audit log entry is never suppressed by this, only
// the email; see securityAlert.service.js.
const recentAlerts = new Map();

setInterval(() => {
    const now = Date.now();
    for (const [k, v] of recentAlerts) {
        if (now - v.first > v.window) recentAlerts.delete(k);
    }
}, 60_000).unref();

export function shouldSendAlert(key, windowMs = 15 * 60 * 1000) {
    if (!key) return true;
    const now = Date.now();
    const e = recentAlerts.get(key);
    if (!e || now - e.first > windowMs) {
        recentAlerts.set(key, { first: now, window: windowMs });
        return true;
    }
    return false;
}
