import { createRemoteJWKSet, decodeProtectedHeader, importJWK, jwtVerify } from "jose";
import { settings } from "./config.js";
const jwks = createRemoteJWKSet(new URL(`${settings.supabaseUrl.replace(/\/+$/, "")}/auth/v1/.well-known/jwks.json`));
export async function decodeSupabaseToken(token) {
    const header = decodeProtectedHeader(token);
    if (header.alg === "HS256") {
        const key = await importJWK({ kty: "oct", k: Buffer.from(settings.supabaseJwtSecret, "utf8").toString("base64url"), alg: "HS256" }, "HS256");
        const verified = await jwtVerify(token, key, { algorithms: ["HS256"] });
        return verified.payload;
    }
    const verified = await jwtVerify(token, jwks);
    return verified.payload;
}
export async function getTokenSubject(token) {
    try {
        const payload = await decodeSupabaseToken(token);
        return typeof payload.sub === "string" ? payload.sub : null;
    }
    catch {
        return null;
    }
}
