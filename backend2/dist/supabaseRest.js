import { settings } from "./config.js";
export class HttpStatusError extends Error {
    status;
    bodyText;
    constructor(status, bodyText) {
        super(bodyText);
        this.status = status;
        this.bodyText = bodyText;
    }
}
function restUrl() {
    return `${settings.supabaseUrl.replace(/\/+$/, "")}/rest/v1`;
}
function headers(userToken, useService = false) {
    const token = useService ? settings.supabaseServiceRoleKey : userToken || settings.supabaseAnonKey;
    return {
        apikey: settings.supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}
function applyFilters(search, filters) {
    for (const [column, operator, value] of filters ?? []) {
        search.set(column, `${operator}.${value}`);
    }
}
async function readJson(response) {
    if (response.status === 204)
        return {};
    const text = await response.text();
    if (!response.ok)
        throw new HttpStatusError(response.status, text);
    return text ? JSON.parse(text) : {};
}
export async function select(table, selectClause, options = {}) {
    const search = new URLSearchParams({ select: selectClause });
    applyFilters(search, options.filters);
    if (options.order)
        search.set("order", options.order);
    if (options.limit != null)
        search.set("limit", String(options.limit));
    if (options.offset != null)
        search.set("offset", String(options.offset));
    const response = await fetch(`${restUrl()}/${table}?${search.toString()}`, {
        headers: headers(options.userToken, options.useService)
    });
    return (await readJson(response));
}
export async function insert(table, payload, options = {}) {
    const requestHeaders = headers(options.userToken, options.useService);
    if (options.returning)
        requestHeaders.Prefer = "return=representation";
    const response = await fetch(`${restUrl()}/${table}`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(payload)
    });
    return readJson(response);
}
export async function update(table, payload, options) {
    const search = new URLSearchParams();
    applyFilters(search, options.filters);
    const requestHeaders = headers(options.userToken, options.useService);
    if (options.returning)
        requestHeaders.Prefer = "return=representation";
    const response = await fetch(`${restUrl()}/${table}?${search.toString()}`, {
        method: "PATCH",
        headers: requestHeaders,
        body: JSON.stringify(payload)
    });
    return readJson(response);
}
export async function remove(table, options) {
    const search = new URLSearchParams();
    applyFilters(search, options.filters);
    const response = await fetch(`${restUrl()}/${table}?${search.toString()}`, {
        method: "DELETE",
        headers: headers(options.userToken, options.useService)
    });
    await readJson(response);
    return true;
}
