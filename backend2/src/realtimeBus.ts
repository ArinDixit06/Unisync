import Redis from "ioredis";

import { settings } from "./config.js";
import { manager } from "./realtime.js";

const channel = "unisync:realtime";
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!settings.useRedis || !settings.redisUrl) throw new Error("Redis disabled");
  if (!redis) redis = new Redis(settings.redisUrl);
  return redis;
}

export async function publishEvent(userId: string, payload: Record<string, unknown>): Promise<void> {
  if (!settings.useRedis || !settings.redisUrl) return;
  await getRedis().publish(channel, JSON.stringify({ userId, payload }));
}

export async function listenAndForward(signal: AbortSignal): Promise<void> {
  if (!settings.useRedis || !settings.redisUrl) return;
  const subscriber = new Redis(settings.redisUrl);
  await subscriber.subscribe(channel);
  subscriber.on("message", (_channel, message) => {
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
