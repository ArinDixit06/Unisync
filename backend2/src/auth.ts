import type { Request, Response, NextFunction } from "express";

import { unauthorized } from "./errors.js";
import { decodeSupabaseToken } from "./supabaseAuth.js";

export interface AuthUser {
  userId: string;
  email?: string | null;
  token: string;
}

export interface AuthenticatedRequest extends Request {
  currentUser?: AuthUser;
}

function extractBearer(request: Request): string {
  const authHeader = request.header("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) unauthorized("Missing token");
  return authHeader.split(" ", 2)[1].trim();
}

export async function requireUser(request: AuthenticatedRequest, _response: Response, next: NextFunction) {
  try {
    const token = extractBearer(request);
    const payload = await decodeSupabaseToken(token);
    if (typeof payload.sub !== "string") unauthorized("Invalid token");
    request.currentUser = {
      userId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
      token
    };
    next();
  } catch (error) {
    next(error);
  }
}
