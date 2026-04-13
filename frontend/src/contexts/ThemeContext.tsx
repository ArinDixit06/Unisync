import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type ThemeMode = "light" | "dark"
export type ThemePreference = ThemeMode | "system"

type ThemeContextValue = {
  theme: ThemeMode
  themePreference: ThemePreference
  toggleTheme: () => void
  setTheme: (theme: ThemePreference) => void
}

const STORAGE_KEY = "unisync-theme"
const FALLBACK_VALUE: ThemeContextValue = {
  theme: "light",
  themePreference: "system",
  toggleTheme: () => {},
  setTheme: () => {}
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system"
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreference] = useState<ThemePreference>(readStoredPreference)
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(getSystemTheme)

  useEffect(() => {
    if (typeof window === "undefined") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => setSystemTheme(media.matches ? "dark" : "light")
    handleChange()

    if (themePreference !== "system") return
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [themePreference])

  const theme = themePreference === "system" ? systemTheme : themePreference

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, themePreference)
  }, [themePreference])

  useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    root.classList.remove("theme-light", "theme-dark")
    root.classList.add(theme === "dark" ? "theme-dark" : "theme-light")
    root.dataset.theme = theme
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themePreference,
      toggleTheme: () => setThemePreference(theme === "dark" ? "light" : "dark"),
      setTheme: (nextTheme: ThemePreference) => setThemePreference(nextTheme)
    }),
    [theme, themePreference]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext) ?? FALLBACK_VALUE
}
