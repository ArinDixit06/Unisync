import { createHmac, timingSafeEqual } from "node:crypto";
import { settings } from "./config.js";
import { ApiError } from "./errors.js";
export function verifySignature(body, signature) {
    if (!settings.webhookSecret) {
        throw new ApiError(500, "server_misconfigured", "Webhook signature secret is not configured");
    }
    if (!signature) {
        throw new ApiError(401, "unauthorized", "Missing webhook signature");
    }
    const expected = createHmac("sha256", settings.webhookSecret).update(body).digest("hex");
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
        throw new ApiError(401, "unauthorized", "Invalid webhook signature");
    }
}
