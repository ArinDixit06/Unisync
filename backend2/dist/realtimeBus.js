import IORedis from "ioredis";
import { settings } from "./config.js";
import { manager } from "./realtime.js";
const channel = "unisync:realtime";
let redis = null;
function createRedis(url) {
    const RedisCtor = IORedis;
    return new RedisCtor(url);
}
function getRedis() {
    if (!settings.useRedis || !settings.redisUrl)
        throw new Error("Redis disabled");
    if (!redis)
        redis = createRedis(settings.redisUrl);
    return redis;
}
export async function publishEvent(userId, payload) {
    if (!settings.useRedis || !settings.redisUrl)
        return;
    await getRedis().publish(channel, JSON.stringify({ userId, payload }));
}
export async function listenAndForward(signal) {
    if (!settings.useRedis || !settings.redisUrl)
        return;
    const subscriber = createRedis(settings.redisUrl);
    await subscriber.subscribe(channel);
    subscriber.on("message", (_channel, message) => {
        try {
            const parsed = JSON.parse(message);
            if (parsed.userId && parsed.payload)
                manager.send(parsed.userId, parsed.payload);
        }
        catch {
            return;
        }
    });
    signal.addEventListener("abort", () => {
        void subscriber.unsubscribe(channel).finally(() => subscriber.quit());
    });
}
