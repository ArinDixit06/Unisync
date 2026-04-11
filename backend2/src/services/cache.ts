import { createHash } from "node:crypto";

import IORedis from "ioredis";

import { settings } from "../config.js";

type RedisClient = ReturnType<typeof createRedis>;
let redis: RedisClient | null = null;
const memoryCache = new Map<string, { expiresAt: number; value: unknown }>();
const memoryVersions = new Map<string, number>();
const memoryLocks = new Map<string, number>();

function stableKey(prefix: string, payload: Record<string, unknown>): string {
  const digest = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  return `${prefix}:${digest}`;
}

function createRedis(url: string) {
  const RedisCtor = IORedis as unknown as new (redisUrl: string) => any
  return new RedisCtor(url)
}

function getRedis(): RedisClient | null {
  if (!settings.useRedis || !settings.redisUrl) return null;
  if (!redis) redis = createRedis(settings.redisUrl);
  return redis;
}

export async function getUserCacheVersion(userId: string): Promise<number> {
  const cache = getRedis();
  const key = `unisync:cache:version:${userId}`;
  if (cache) {
    const value = await cache.get(key);
    return value ? Number(value) : 0;
  }
  return memoryVersions.get(key) ?? 0;
}

export async function bumpUserCacheVersion(userId: string): Promise<number> {
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

export async function getCachedJson<T>(prefix: string, payload: Record<string, unknown>): Promise<T | null> {
  const cache = getRedis();
  const key = stableKey(prefix, payload);
  if (cache) {
    const raw = await cache.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  const entry = memoryCache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function setCachedJson(
  prefix: string,
  payload: Record<string, unknown>,
  value: unknown,
  ttlSeconds = 20
): Promise<void> {
  const cache = getRedis();
  const key = stableKey(prefix, payload);
  if (cache) {
    await cache.set(key, JSON.stringify(value), "EX", ttlSeconds);
    return;
  }
  memoryCache.set(key, { expiresAt: Date.now() + ttlSeconds * 1000, value });
}

export async function acquireRecentLock(scope: string, identity: string, ttlSeconds = 900): Promise<boolean> {
  const cache = getRedis();
  const key = `unisync:lock:${scope}:${identity}`;
  if (cache) {
    const result = await cache.set(key, "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  }
  const now = Date.now();
  const expiresAt = memoryLocks.get(key) ?? 0;
  if (expiresAt > now) return false;
  memoryLocks.set(key, now + ttlSeconds * 1000);
  return true;
}
