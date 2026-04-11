import { settings } from "./config.js";

export type Filter = [string, string, string];

export class HttpStatusError extends Error {
  status: number;
  bodyText: string;

  constructor(status: number, bodyText: string) {
    super(bodyText);
    this.status = status;
    this.bodyText = bodyText;
  }
}

function restUrl(): string {
  return `${settings.supabaseUrl.replace(/\/+$/, "")}/rest/v1`;
}

function headers(userToken?: string | null, useService = false): Record<string, string> {
  const token = useService ? settings.supabaseServiceRoleKey : userToken || settings.supabaseAnonKey;
  return {
    apikey: settings.supabaseAnonKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

function applyFilters(search: URLSearchParams, filters?: Filter[]): void {
  for (const [column, operator, value] of filters ?? []) {
    search.set(column, `${operator}.${value}`);
  }
}

function parseContentRangeTotal(response: Response): number {
  const contentRange = response.headers.get("content-range") || ""
  const match = contentRange.match(/\/(\d+|\*)$/)
  if (!match || match[1] === "*") return 0
  return Number(match[1])
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) return {};
  const text = await response.text();
  if (!response.ok) throw new HttpStatusError(response.status, text);
  return text ? JSON.parse(text) : {};
}

export async function select(
  table: string,
  selectClause: string,
  options: {
    filters?: Filter[];
    order?: string | null;
    limit?: number | null;
    offset?: number | null;
    userToken?: string | null;
    useService?: boolean;
  } = {}
): Promise<any[]> {
  const search = new URLSearchParams({ select: selectClause });
  applyFilters(search, options.filters);
  if (options.order) search.set("order", options.order);
  if (options.limit != null) search.set("limit", String(options.limit));
  if (options.offset != null) search.set("offset", String(options.offset));

  const response = await fetch(`${restUrl()}/${table}?${search.toString()}`, {
    headers: headers(options.userToken, options.useService)
  });
  return (await readJson(response)) as any[];
}

export async function insert(
  table: string,
  payload: unknown,
  options: { userToken?: string | null; useService?: boolean; returning?: boolean } = {}
): Promise<any> {
  const requestHeaders = headers(options.userToken, options.useService);
  if (options.returning) requestHeaders.Prefer = "return=representation";
  const response = await fetch(`${restUrl()}/${table}`, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(payload)
  });
  return readJson(response);
}

export async function update(
  table: string,
  payload: unknown,
  options: { filters: Filter[]; userToken?: string | null; useService?: boolean; returning?: boolean }
): Promise<any> {
  const search = new URLSearchParams();
  applyFilters(search, options.filters);
  const requestHeaders = headers(options.userToken, options.useService);
  if (options.returning) requestHeaders.Prefer = "return=representation";
  const response = await fetch(`${restUrl()}/${table}?${search.toString()}`, {
    method: "PATCH",
    headers: requestHeaders,
    body: JSON.stringify(payload)
  });
  return readJson(response);
}

export async function remove(
  table: string,
  options: { filters: Filter[]; userToken?: string | null; useService?: boolean }
): Promise<boolean> {
  const search = new URLSearchParams();
  applyFilters(search, options.filters);
  const response = await fetch(`${restUrl()}/${table}?${search.toString()}`, {
    method: "DELETE",
    headers: headers(options.userToken, options.useService)
  });
  await readJson(response);
  return true;
}

export async function count(
  table: string,
  options: {
    filters?: Filter[];
    userToken?: string | null;
    useService?: boolean;
  } = {}
): Promise<number> {
  const search = new URLSearchParams({ select: "id" });
  applyFilters(search, options.filters);

  const requestHeaders = headers(options.userToken, options.useService);
  requestHeaders.Prefer = "count=exact";
  requestHeaders.Range = "0-0";

  const response = await fetch(`${restUrl()}/${table}?${search.toString()}`, {
    method: "GET",
    headers: requestHeaders
  });
  await readJson(response);
  return parseContentRangeTotal(response);
}
