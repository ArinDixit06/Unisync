import { GoogleGenerativeAI } from "@google/generative-ai";

import { settings } from "../config.js";

let client: GoogleGenerativeAI | null = null;
let failureCount = 0;
let firstFailureTime = 0;
let circuitOpenUntil = 0;

const ALLOWED_PRIORITIES = new Set(["high", "medium", "low"]);
const ALLOWED_RISKS = new Set(["high", "medium", "low"]);
const ALLOWED_CATEGORIES = new Set(["primary", "updates", "promotions", "social", "forums"]);
const DEFAULT_FLASH_MODEL = "gemini-2.5-flash";
const FLASH_MODEL_FALLBACKS = [DEFAULT_FLASH_MODEL, "gemini-2.5-flash-lite", "gemini-2.0-flash"];

function ensureClient(): GoogleGenerativeAI {
  if (!client) client = new GoogleGenerativeAI(settings.geminiApiKey);
  return client;
}

function boundedText(value: string, limit = 6000): string {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}

function circuitOpen(): boolean {
  return Date.now() < circuitOpenUntil;
}

function recordFailure(): void {
  const now = Date.now();
  if (!firstFailureTime || now - firstFailureTime > 60_000) {
    firstFailureTime = now;
    failureCount = 0;
  }
  failureCount += 1;
  if (failureCount >= 5) {
    circuitOpenUntil = now + 120_000;
    failureCount = 0;
    firstFailureTime = 0;
  }
}

function extractJson(text: string): any {
  const candidate = text.trim().replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const startObj = candidate.indexOf("{");
    const endObj = candidate.lastIndexOf("}");
    const startList = candidate.indexOf("[");
    const endList = candidate.lastIndexOf("]");
    if (startObj !== -1 && endObj > startObj) return JSON.parse(candidate.slice(startObj, endObj + 1));
    if (startList !== -1 && endList > startList) return JSON.parse(candidate.slice(startList, endList + 1));
    throw new Error("Unable to parse Gemini JSON");
  }
}

async function callJson(modelName: string, prompt: string): Promise<any> {
  if (circuitOpen()) throw new Error("Gemini circuit open");
  try {
    const model = ensureClient().getGenerativeModel({
      model: modelName,
      generationConfig: { temperature: 0.15, responseMimeType: "application/json" }
    });
    const result = await model.generateContent(prompt);
    return extractJson(result.response.text());
  } catch (error) {
    recordFailure();
    throw error;
  }
}

function flashModel(): string {
  return settings.geminiModel ?? DEFAULT_FLASH_MODEL;
}

function flashModelCandidates(): string[] {
  const preferred = flashModel().trim();
  const ordered = [preferred, ...FLASH_MODEL_FALLBACKS];
  return [...new Set(ordered.filter(Boolean))];
}

async function callJsonWithFallbacks(modelNames: string[], prompt: string): Promise<any> {
  let lastError: unknown = null;
  for (const modelName of modelNames) {
    try {
      return await callJson(modelName, prompt);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("Gemini request failed");
}

export async function summarizeEmail(text: string): Promise<string[] | null> {
  const bounded = boundedText(text);
  if (!bounded) return null;
  const data = await callJson(
    flashModel(),
    `Summarize this student-facing email into exactly 3 concise bullet points. Each bullet must be 6 to 15 words. Return JSON only as {"bullets":[..]}.\n\nEMAIL:\n${bounded}`
  );
  const bullets = Array.isArray(data?.bullets) ? data.bullets.map((item: unknown) => String(item).trim().slice(0, 120)).filter(Boolean) : [];
  return bullets.length === 3 ? bullets : null;
}

export async function priorityAnalysis(sender: string, subject: string, body: string): Promise<any | null> {
  const data = await callJson(
    flashModel(),
    `Assign priority for a student inbox. Consider deadlines, account actions, schedule changes, exams, finances, and urgency. Return JSON only as {priority:'high'|'medium'|'low',reason:string,confidence:float}.\n\nSENDER:${boundedText(sender, 200)}\nSUBJECT:${boundedText(subject, 300)}\nBODY:${boundedText(body)}`
  );
  const priority = String(data?.priority ?? "").toLowerCase();
  if (!ALLOWED_PRIORITIES.has(priority)) return null;
  return {
    priority,
    reason: String(data?.reason ?? "Priority inferred from message content.").slice(0, 240),
    confidence: Number(data?.confidence ?? 0.5)
  };
}

export async function categoryClassification(sender: string, subject: string, snippet: string): Promise<string | null> {
  const data = await callJson(
    flashModel(),
    `Classify a student email into one of: primary, updates, promotions, social, forums. Return JSON only as {category:'primary'|'updates'|'promotions'|'social'|'forums'}.\n\nSENDER:${boundedText(sender, 200)}\nSUBJECT:${boundedText(subject, 300)}\nSNIPPET:${boundedText(snippet, 600)}`
  );
  const category = String(data?.category ?? "").toLowerCase();
  return ALLOWED_CATEGORIES.has(category) ? category : null;
}

export async function phishingAnalysis(sender: string, subject: string, body: string): Promise<any | null> {
  const data = await callJson(
    "gemini-1.5-pro",
    `Analyze this email for phishing, impersonation, credential theft, payment fraud, or manipulative urgency. Return JSON only as {risk:'low'|'medium'|'high',reasons:[string]}.\n\nSENDER:${boundedText(sender, 200)}\nSUBJECT:${boundedText(subject, 300)}\nBODY:${boundedText(body)}`
  );
  const risk = String(data?.risk ?? "").toLowerCase();
  if (!ALLOWED_RISKS.has(risk)) return null;
  return {
    risk,
    reasons: Array.isArray(data?.reasons) ? data.reasons.map((item: unknown) => String(item).trim().slice(0, 160)).filter(Boolean).slice(0, 5) : []
  };
}

export async function extractEvents(body: string): Promise<any[] | null> {
  const bounded = boundedText(body);
  if (!bounded) return null;
  const data = await callJson(
    "gemini-1.5-pro",
    `Extract real events or deadlines from this email body. Return JSON list only. Each item must have title, date, time, location, description, confidence. Only include items with confidence greater than 0.8.\n\nBODY:\n${bounded}`
  );
  if (!Array.isArray(data)) return null;
  const normalized = data
    .filter((item) => Number(item?.confidence ?? 0) > 0.8)
    .map((item) => ({
      title: String(item.title ?? "Event").slice(0, 140),
      date: item.date ? String(item.date) : null,
      time: item.time ? String(item.time) : null,
      location: item.location ? String(item.location).slice(0, 160) : null,
      description: item.description ? String(item.description).slice(0, 240) : null,
      confidence: Number(item.confidence)
    }));
  return normalized.length ? normalized : null;
}

export async function emailInsights(
  sender: string,
  subject: string,
  body: string,
  question: string
): Promise<{
  answer: string;
  key_points: string[];
  suggested_action: string | null;
}> {
  const boundedBody = boundedText(body, 5000);
  const boundedQuestion = boundedText(question, 400);

  if (!boundedQuestion) {
    return {
      answer: "Please ask a question.",
      key_points: [],
      suggested_action: null
    };
  }

  const prompt =
    "You are an AI assistant helping a university student understand their email.\n" +
    "Given the email below, answer the user's question clearly and helpfully.\n" +
    'Return JSON only with this shape: {"answer":"string (2-4 sentences)","key_points":["string", ...],"suggested_action":"string or null"}\n\n' +
    `SENDER: ${boundedText(sender, 200)}\n` +
    `SUBJECT: ${boundedText(subject, 300)}\n` +
    `BODY:\n${boundedBody}\n\n` +
    `USER QUESTION: ${boundedQuestion}`;

  try {
    const data = await callJsonWithFallbacks(flashModelCandidates(), prompt);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return {
        answer: "Could not parse AI response.",
        key_points: [],
        suggested_action: null
      };
    }

    const answer = String((data as any).answer ?? "").trim().slice(0, 800) || "No answer generated.";
    const keyPoints = Array.isArray((data as any).key_points)
      ? (data as any).key_points
          .map((point: unknown) => String(point).trim().slice(0, 200))
          .filter(Boolean)
          .slice(0, 5)
      : [];
    const suggestedAction = String((data as any).suggested_action ?? "").trim().slice(0, 300) || null;

    return {
      answer,
      key_points: keyPoints,
      suggested_action: suggestedAction
    };
  } catch {
    return {
      answer: "AI is temporarily unavailable. Please try again shortly.",
      key_points: [],
      suggested_action: null
    };
  }
}
