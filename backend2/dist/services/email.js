import { Buffer } from "node:buffer";
import { load } from "cheerio";
import quotedPrintable from "quoted-printable";
export function cleanHtml(html) {
    if (!html)
        return "";
    const $ = load(html);
    $("script").remove();
    return $.html();
}
export function extractPreview(text, maxLen = 200) {
    return text ? text.replace(/\s+/g, " ").trim().slice(0, maxLen) : "";
}
function decodePart(data, transferEncoding) {
    try {
        const padded = data + "=".repeat((4 - (data.length % 4 || 4)) % 4);
        let decoded = Buffer.from(padded, "base64url");
        if (transferEncoding?.toLowerCase().includes("quoted-printable")) {
            decoded = Buffer.from(quotedPrintable.decode(decoded.toString("utf8")));
        }
        return decoded.toString("utf8");
    }
    catch {
        return "";
    }
}
function getTransferEncoding(part) {
    for (const header of part?.headers ?? []) {
        if (String(header?.name ?? "").toLowerCase() === "content-transfer-encoding") {
            return String(header.value ?? "");
        }
    }
    return null;
}
async function getPartData(part, fetchAttachment) {
    const encoding = getTransferEncoding(part);
    const data = part?.body?.data;
    if (data)
        return decodePart(data, encoding);
    const attachmentId = part?.body?.attachmentId;
    if (attachmentId && fetchAttachment) {
        try {
            const attachmentData = await fetchAttachment(attachmentId);
            return attachmentData ? decodePart(attachmentData, encoding) : "";
        }
        catch {
            return "";
        }
    }
    return "";
}
function normalizeContentId(value) {
    if (!value)
        return null;
    return value.replace(/[<>]/g, "").trim().toLowerCase() || null;
}
function getHeader(part, name) {
    for (const header of part?.headers ?? []) {
        if (String(header?.name ?? "").toLowerCase() === name.toLowerCase()) {
            return String(header.value ?? "");
        }
    }
    return null;
}
function isInlineImagePart(part) {
    const disposition = String(getHeader(part, "content-disposition") ?? "").toLowerCase();
    const contentId = normalizeContentId(getHeader(part, "content-id"));
    return String(part?.mimeType ?? "").toLowerCase().startsWith("image/") && (Boolean(contentId) || disposition.includes("inline"));
}
function replaceCidSources(html, inlineAssets) {
    if (!html || !inlineAssets.length)
        return html;
    let output = html;
    for (const asset of inlineAssets) {
        const escaped = asset.contentId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        output = output.replace(new RegExp(`cid:${escaped}`, "gi"), asset.dataUrl);
    }
    return output;
}
async function collectInlineGmailAssets(payload, fetchAttachment) {
    if (!payload)
        return [];
    const assets = [];
    const stack = [payload];
    while (stack.length) {
        const part = stack.pop();
        if (!part)
            continue;
        if (Array.isArray(part.parts)) {
            stack.push(...part.parts);
        }
        if (!isInlineImagePart(part))
            continue;
        const contentId = normalizeContentId(getHeader(part, "content-id"));
        const bodyData = await getPartData(part, fetchAttachment);
        if (!contentId || !bodyData)
            continue;
        const mimeType = String(part.mimeType || "image/png");
        const base64 = Buffer.from(bodyData, "utf8").toString("base64");
        assets.push({ contentId, dataUrl: `data:${mimeType};base64,${base64}` });
    }
    return assets;
}
async function extractGmailBody(payload, fetchAttachment) {
    if (!payload)
        return "";
    const parts = payload.parts ?? [];
    if (parts.length) {
        for (const mimeType of ["text/html", "text/plain"]) {
            for (const part of parts) {
                if (part.mimeType === mimeType) {
                    const data = await getPartData(part, fetchAttachment);
                    if (data)
                        return data;
                }
            }
        }
        for (const part of parts) {
            const nested = await extractGmailBody(part, fetchAttachment);
            if (nested)
                return nested;
        }
        return "";
    }
    const mimeType = payload.mimeType ?? "";
    if (payload.body && (mimeType === "text/html" || mimeType === "text/plain" || !mimeType)) {
        return getPartData(payload, fetchAttachment);
    }
    return "";
}
export async function parseGmailMessage(message, fetchAttachment) {
    const payload = message.payload ?? {};
    const headerMap = Object.fromEntries((payload.headers ?? []).filter((h) => h?.name).map((h) => [String(h.name).toLowerCase(), h.value]));
    const body = await extractGmailBody(payload, fetchAttachment);
    const inlineAssets = await collectInlineGmailAssets(payload, fetchAttachment);
    const sender = String(headerMap.from ?? "");
    return {
        message_id: message.id,
        thread_id: message.threadId,
        subject: headerMap.subject ?? null,
        sender_name: sender.includes("<") ? sender.split("<", 1)[0].trim() : sender,
        sender_email: sender.includes("<") ? sender.split("<").at(-1)?.replace(">", "").trim() : sender,
        received_at: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null,
        snippet: message.snippet,
        body: replaceCidSources(body, inlineAssets),
        headers: headerMap
    };
}
export function parseOutlookMessage(message) {
    const sender = message?.from?.emailAddress ?? {};
    const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
    const inlineAssets = attachments
        .filter((attachment) => attachment?.isInline && attachment?.contentId && attachment?.contentBytes)
        .map((attachment) => ({
        contentId: normalizeContentId(String(attachment.contentId)),
        dataUrl: `data:${String(attachment.contentType || "image/png")};base64,${String(attachment.contentBytes)}`
    }))
        .filter((asset) => asset.contentId);
    return {
        message_id: message.id,
        thread_id: message.conversationId,
        subject: message.subject,
        sender_name: sender.name ?? null,
        sender_email: sender.address ?? "",
        received_at: message.receivedDateTime ?? null,
        snippet: message.bodyPreview ?? null,
        body: replaceCidSources(message?.body?.content ?? "", inlineAssets),
        headers: {}
    };
}
