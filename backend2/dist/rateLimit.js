import { ApiError } from "./errors.js";
import { getTokenSubject } from "./supabaseAuth.js";
export class RateLimiter {
    limit;
    keyPrefix;
    windows = new Map();
    constructor(limitPerMinute, keyPrefix) {
        this.limit = limitPerMinute;
        this.keyPrefix = keyPrefix;
    }
    check(key) {
        const now = Date.now();
        const scoped = `${this.keyPrefix}:${key}`;
        const window = this.windows.get(scoped) ?? { start: now, count: 0 };
        if (now - window.start >= 60_000) {
            window.start = now;
            window.count = 0;
        }
        window.count += 1;
        this.windows.set(scoped, window);
        if (window.count > this.limit) {
            throw new ApiError(429, "rate_limited", "Too many requests");
        }
    }
}
export function ipKey(request) {
    return request.ip || request.socket.remoteAddress || "unknown";
}
export async function userKey(request) {
    const authHeader = request.header("authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer "))
        return ipKey(request);
    const token = authHeader.split(" ", 2)[1].trim();
    return (await getTokenSubject(token)) ?? ipKey(request);
}
export function rateLimit(limiter, keyFn) {
    return async (request, _response, next) => {
        try {
            limiter.check(await keyFn(request));
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
