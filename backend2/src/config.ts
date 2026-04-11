import "dotenv/config";

function boolFromEnv(value: string | undefined, fallback = false): boolean {
  if (value == null) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value == null || value === "") {
    throw new Error(`${name} is required`);
  }
  return value;
}

export const settings = {
  environment: process.env.ENVIRONMENT ?? "development",
  apiBaseUrl: process.env.API_BASE_URL ?? "https://unisync-3kk2.onrender.com",
  frontendUrl: process.env.FRONTEND_URL ?? "https://unisync-five.vercel.app",
  frontendUrls: process.env.FRONTEND_URLS ?? null,
  databaseUrl: process.env.DATABASE_URL ?? null,
  useDb: boolFromEnv(process.env.USE_DB, false),
  redisUrl: process.env.REDIS_URL ?? null,
  useRedis: boolFromEnv(process.env.USE_REDIS, false),
  supabaseUrl: required("SUPABASE_URL"),
  supabaseAnonKey: required("SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? required("JWT_SECRET"),
  googleClientId: required("GOOGLE_CLIENT_ID"),
  googleClientSecret: required("GOOGLE_CLIENT_SECRET"),
  googlePubsubTopic: process.env.GOOGLE_PUBSUB_TOPIC ?? null,
  googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT ?? null,
  gmailRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? null,
  microsoftClientId: required("MICROSOFT_CLIENT_ID"),
  microsoftClientSecret: required("MICROSOFT_CLIENT_SECRET"),
  microsoftTenantId: required("MICROSOFT_TENANT_ID"),
  outlookRedirectUri: process.env.MICROSOFT_REDIRECT_URI ?? null,
  geminiApiKey: required("GEMINI_API_KEY"),
  geminiModel: process.env.GEMINI_MODEL ?? null,
  tokenEncryptionKey: required("TOKEN_ENCRYPTION_KEY"),
  jwtSecret: required("JWT_SECRET"),
  webhookSecret: process.env.WEBHOOK_SECRET ?? null
};

export function frontendOrigins(): string[] {
  const candidates = [
    settings.frontendUrl,
    "https://unisync-five.vercel.app",
    "https://unisync-3kk2.onrender.com",
    ...(settings.frontendUrls ? settings.frontendUrls.split(",") : [])
  ];

  const seen = new Set<string>();
  const origins: string[] = [];
  for (const candidate of candidates) {
    const origin = candidate.trim().replace(/\/+$/, "");
    if (!origin || seen.has(origin)) continue;
    seen.add(origin);
    origins.push(origin);
  }
  return origins;
}

export function gmailRedirect(): string {
  return settings.gmailRedirectUri ?? `${settings.apiBaseUrl}/auth/callback/gmail`;
}

export function outlookRedirect(): string {
  return settings.outlookRedirectUri ?? `${settings.apiBaseUrl}/auth/callback/outlook`;
}
