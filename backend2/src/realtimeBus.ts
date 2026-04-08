import IORedis from "ioredis";

import { settings } from "./config.js";
import { manager } from "./realtime.js";

const channel = "unisync:realtime";
type RedisClient = ReturnType<typeof createRedis>;
let redis: RedisClient | null = null;

function createRedis(url: string) {
  return new IORedis(url);
}

function getRedis(): RedisClient {
  if (!settings.useRedis || !settings.redisUrl) throw new Error("Redis disabled");
  if (!redis) redis = createRedis(settings.redisUrl);
  return redis;
}

export async function publishEvent(userId: string, payload: Record<string, unknown>): Promise<void> {
  if (!settings.useRedis || !settings.redisUrl) return;
  await getRedis().publish(channel, JSON.stringify({ userId, payload }));
}

export async function listenAndForward(signal: AbortSignal): Promise<void> {
  if (!settings.useRedis || !settings.redisUrl) return;
  const subscriber = createRedis(settings.redisUrl);
  await subscriber.subscribe(channel);
  subscriber.on("message", (_channel: string, message: string) => {
    try {
      const parsed = JSON.parse(message) as { userId?: string; payload?: Record<string, unknown> };
      if (parsed.userId && parsed.payload) manager.send(parsed.userId, parsed.payload);
    } catch {
      return;
    }
  });
  signal.addEventListener("abort", () => {
    void subscriber.unsubscribe(channel).finally(() => subscriber.quit());
  });
}
