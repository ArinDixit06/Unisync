import { createHash } from "node:crypto";
import IORedis from "ioredis";
import { settings } from "../config.js";
let redis = null;
const memoryCache = new Map();
const memoryVersions = new Map();
const memoryLocks = new Map();
function stableKey(prefix, payload) {
    const digest = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    return `${prefix}:${digest}`;
}
function createRedis(url) {
    const RedisCtor = IORedis;
    return new RedisCtor(url);
}
function getRedis() {
    if (!settings.useRedis || !settings.redisUrl)
        return null;
    if (!redis)
        redis = createRedis(settings.redisUrl);
    return redis;
}
export async function getUserCacheVersion(userId) {
    const cache = getRedis();
    const key = `unisync:cache:version:${userId}`;
    if (cache) {
        const value = await cache.get(key);
        return value ? Number(value) : 0;
    }
    return memoryVersions.get(key) ?? 0;
}
export async function bumpUserCacheVersion(userId) {
    const cache = getRedis();
    const key = `unisync:cache:version:${userId}`;
    if (cache) {
        const value = await cache.incr(key);
        await cache.expire(key, 86400);
        return value;
    }
    const next = (memoryVersions.get(key) ?? 0) + 1;
    memoryVersions.set(key, next);
    return next;
}
export async function getCachedJson(prefix, payload) {
    const cache = getRedis();
    const key = stableKey(prefix, payload);
    if (cache) {
        const raw = await cache.get(key);
        return raw ? JSON.parse(raw) : null;
    }
    const entry = memoryCache.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
        memoryCache.delete(key);
        return null;
    }
    return entry.value;
}
export async function setCachedJson(prefix, payload, value, ttlSeconds = 20) {
    const cache = getRedis();
    const key = stableKey(prefix, payload);
    if (cache) {
        await cache.set(key, JSON.stringify(value), "EX", ttlSeconds);
        return;
    }
    memoryCache.set(key, { expiresAt: Date.now() + ttlSeconds * 1000, value });
}
export async function acquireRecentLock(scope, identity, ttlSeconds = 900) {
    const cache = getRedis();
    const key = `unisync:lock:${scope}:${identity}`;
    if (cache) {
        const result = await cache.set(key, "1", "EX", ttlSeconds, "NX");
        return result === "OK";
    }
    const now = Date.now();
    const expiresAt = memoryLocks.get(key) ?? 0;
    if (expiresAt > now)
        return false;
    memoryLocks.set(key, now + ttlSeconds * 1000);
    return true;
}
