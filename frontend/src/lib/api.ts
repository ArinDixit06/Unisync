import { useAuthStore } from "../stores/authStore"

const DEFAULT_PRODUCTION_API_BASE_URL = "https://unisync-pztl.onrender.com"
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? DEFAULT_PRODUCTION_API_BASE_URL : "")

export function getWsBaseUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/^http:/, "ws:").replace(/^https:/, "wss:")
  }
  return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().accessToken
  const headers = new Headers(options.headers || {})
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  if (options.body != null && !headers.has("Content-Type")) {
    const body = options.body
    const isNonJsonBody =
      typeof FormData !== "undefined" && body instanceof FormData ||
      typeof Blob !== "undefined" && body instanceof Blob ||
      typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer ||
      ArrayBuffer.isView(body as ArrayBufferView) ||
      typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams
    if (!isNonJsonBody) {
      headers.set("Content-Type", "application/json")
    }
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message =
      err?.message ||
      err?.detail?.message ||
      err?.error?.message ||
      err?.error?.error_description ||
      "Request failed"
    throw new Error(message)
  }
  return res.json()
}
