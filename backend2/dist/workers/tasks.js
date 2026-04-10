import * as chrono from "chrono-node";
import { load } from "cheerio";
import { decryptMailJson, decryptMailText } from "../mailCrypto.js";
import { publishEvent } from "../realtimeBus.js";
import { insert, select, update } from "../supabaseRest.js";
import { bumpUserCacheVersion } from "../services/cache.js";
import { categoryClassification, extractEvents, phishingAnalysis, priorityAnalysis, summarizeEmail } from "../services/gemini.js";
import { deterministicPriority, deterministicRisk } from "../services/security.js";
function stripHtml(html) {
    return load(html).text().replace(/\s+/g, " ").trim();
}
function fallbackEvents(bodyHtml, subject) {
    const text = stripHtml(bodyHtml).slice(0, 4000);
    if (!text)
        return null;
    const results = chrono.parse(text, new Date(), { forwardDate: true });
    if (!results.length)
        return null;
    const start = results[0].start.date();
    return [
        {
            title: subject || "Event",
            date: start.toISOString().slice(0, 10),
            time: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
            location: null,
            description: results[0].text,
            confidence: 0.6
        }
    ];
}
function mergeReasons(...groups) {
    return Array.from(new Set(groups.flat().map((item) => String(item).trim()).filter(Boolean))).slice(0, 5);
}
function choosePriority(aiPriority, deterministic) {
    if (!aiPriority)
        return deterministic;
    if (!deterministic)
        return aiPriority;
    const order = { low: 0, medium: 1, high: 2 };
    if (order[deterministic.priority] > order[aiPriority.priority])
        return deterministic;
    if (order[aiPriority.priority] > order[deterministic.priority])
        return aiPriority;
    return {
        priority: aiPriority.priority,
        reason: [deterministic.reason, aiPriority.reason].filter(Boolean).join("; ").slice(0, 240),
        confidence: Math.max(Number(aiPriority.confidence ?? 0.5), Number(deterministic.confidence ?? 0.5))
    };
}
export async function processEmail(emailId) {
    const emails = await select("emails", "id,user_id,subject,sender_name,sender_email,preview_snippet,body_html,body_html_enc,raw_headers,raw_headers_enc", { filters: [["id", "eq", emailId]], useService: true });
    if (!emails.length)
        return;
    const email = emails[0];
    const bodyHtml = decryptMailText(email.body_html_enc) || email.body_html || "";
    const rawHeaders = decryptMailJson(email.raw_headers_enc, email.raw_headers || {});
    await update("emails", { processing_status: "processing", processing_started_at: new Date().toISOString(), processing_error: null }, { filters: [["id", "eq", emailId]], useService: true });
    const [detRiskLevel, detRiskReasons] = deterministicRisk(email.sender_email, email.sender_name, rawHeaders, email.subject, bodyHtml);
    const detPriority = deterministicPriority(email.sender_email, email.subject, bodyHtml);
    let category = null;
    let priority = null;
    let summary = null;
    let aiRisk = null;
    let events = null;
    try {
        category = await categoryClassification(email.sender_email, email.subject || "", email.preview_snippet || "");
    }
    catch { }
    try {
        priority = await priorityAnalysis(email.sender_email, email.subject || "", bodyHtml);
    }
    catch { }
    try {
        summary = await summarizeEmail(bodyHtml);
    }
    catch { }
    if (detRiskLevel !== "high") {
        try {
            aiRisk = await phishingAnalysis(email.sender_email, email.subject || "", bodyHtml);
        }
        catch { }
    }
    try {
        events = await extractEvents(bodyHtml);
    }
    catch { }
    if (!events)
        events = fallbackEvents(bodyHtml, email.subject);
    const finalPriority = choosePriority(priority, detPriority);
    const riskOrder = { low: 0, medium: 1, high: 2 };
    let finalRisk = detRiskLevel;
    if (aiRisk && riskOrder[aiRisk.risk] > riskOrder[finalRisk])
        finalRisk = aiRisk.risk;
    const finalReasons = mergeReasons(detRiskReasons, aiRisk?.reasons ?? []);
    await update("emails", {
        processing_status: "done",
        processing_completed_at: new Date().toISOString(),
        summary_bullets: summary,
        risk_level: finalRisk,
        risk_reasons: finalReasons,
        priority_level: finalPriority?.priority ?? null,
        priority_reason: finalPriority?.reason ?? null,
        category: category ?? "primary"
    }, { filters: [["id", "eq", emailId]], useService: true });
    for (const event of events ?? []) {
        const existing = await select("suggested_events", "id,title,start_datetime", {
            filters: [["email_id", "eq", emailId], ["user_id", "eq", email.user_id]],
            useService: true
        });
        const startDatetime = event.date ? new Date(`${event.date}T${event.time ?? "00:00"}:00`).toISOString() : null;
        const fingerprint = JSON.stringify([event.title, startDatetime]);
        const existingFingerprints = new Set(existing.map((item) => JSON.stringify([item.title, item.start_datetime])));
        if (existingFingerprints.has(fingerprint))
            continue;
        await insert("suggested_events", {
            email_id: emailId,
            user_id: email.user_id,
            title: event.title,
            start_datetime: startDatetime,
            end_datetime: null,
            location: event.location,
            description: event.description
        }, { useService: true });
    }
    await publishEvent(email.user_id, {
        type: "email_processed",
        email_id: emailId,
        processing_status: "done",
        priority_level: finalPriority?.priority ?? null,
        risk_level: finalRisk,
        category: category ?? "primary"
    });
    await bumpUserCacheVersion(email.user_id);
}
