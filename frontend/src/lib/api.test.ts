import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { apiFetch } from "./api"
import { useAuthStore } from "../stores/authStore"

describe("apiFetch", () => {
  beforeEach(() => {
    useAuthStore.getState().setAccessToken(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("attaches auth headers and returns json", async () => {
    useAuthStore.getState().setAccessToken("token-123")
    const json = vi.fn().mockResolvedValue({ ok: true })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json })
    vi.stubGlobal("fetch", fetchMock)

    const result = await apiFetch("/health", { method: "POST", body: JSON.stringify({ hello: "world" }) })

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, options] = fetchMock.mock.calls[0]
    const headers = options.headers as Headers
    expect(headers.get("Authorization")).toBe("Bearer token-123")
    expect(headers.get("Content-Type")).toBe("application/json")
  })

  it("prefers structured error messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: { message: "Search is temporarily unavailable" }
        })
      })
    )

    await expect(apiFetch("/search?q=test")).rejects.toThrow("Search is temporarily unavailable")
  })
})
