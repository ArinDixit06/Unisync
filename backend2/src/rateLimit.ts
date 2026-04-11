import type { NextFunction, Request, Response } from "express";

import { ApiError } from "./errors.js";
import { getTokenSubject } from "./supabaseAuth.js";

type WindowEntry = { start: number; count: number };

export class RateLimiter {
  limit: number;
  keyPrefix: string;
  windows = new Map<string, WindowEntry>();

  constructor(limitPerMinute: number, keyPrefix: string) {
    this.limit = limitPerMinute;
    this.keyPrefix = keyPrefix;
  }

  check(key: string): void {
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

export function ipKey(request: Request): string {
  return request.ip || request.socket.remoteAddress || "unknown";
}

export async function userKey(request: Request): Promise<string> {
  const authHeader = request.header("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) return ipKey(request);
  const token = authHeader.split(" ", 2)[1].trim();
  return (await getTokenSubject(token)) ?? ipKey(request);
}

export function rateLimit(limiter: RateLimiter, keyFn: (request: Request) => string | Promise<string>) {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      limiter.check(await keyFn(request));
      next();
    } catch (error) {
      next(error);
    }
  };
}
