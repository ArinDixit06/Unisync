import { useAuthStore } from "../stores/authStore"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().accessToken
  const headers = new Headers(options.headers || {})
  headers.set("Content-Type", "application/json")
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
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
