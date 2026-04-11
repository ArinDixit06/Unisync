import { unauthorized } from "./errors.js";
import { decodeSupabaseToken } from "./supabaseAuth.js";
function extractBearer(request) {
    const authHeader = request.header("authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer "))
        unauthorized("Missing token");
    return authHeader.split(" ", 2)[1].trim();
}
export async function requireUser(request, _response, next) {
    try {
        const token = extractBearer(request);
        const payload = await decodeSupabaseToken(token);
        if (typeof payload.sub !== "string")
            unauthorized("Invalid token");
        request.currentUser = {
            userId: payload.sub,
            email: typeof payload.email === "string" ? payload.email : null,
            token
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
