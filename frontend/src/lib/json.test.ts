import { describe, expect, it } from "vitest"
import { safeParseJsonArray } from "./json"

describe("safeParseJsonArray", () => {
  it("returns string arrays unchanged", () => {
    expect(safeParseJsonArray(["alpha", "beta"])).toEqual(["alpha", "beta"])
  })

  it("filters out non-string values from parsed arrays", () => {
    expect(safeParseJsonArray('["alpha", 1, null, "beta", true]')).toEqual(["alpha", "beta"])
  })

  it("returns an empty array for invalid JSON or non-array input", () => {
    expect(safeParseJsonArray("{bad json")).toEqual([])
    expect(safeParseJsonArray({})).toEqual([])
    expect(safeParseJsonArray("null")).toEqual([])
  })
})
