"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string | "class"
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

interface ThemeProviderContextValue {
  theme: Theme | undefined
  setTheme: (theme: Theme) => void
  resolvedTheme?: "light" | "dark"
}

const ThemeContext = React.createContext<ThemeProviderContextValue | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme
    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme | null
      return storedTheme || defaultTheme
    } catch (e) {
      return defaultTheme
    }
  })

  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">()

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleMediaQueryChange = () => {
      const systemTheme = mediaQuery.matches ? "dark" : "light"
      if (theme === "system" || !theme) {
        setResolvedTheme(systemTheme)
        if (attribute === "class" && !disableTransitionOnChange) {
          document.documentElement.classList.add("disable-transitions")
        }
        document.documentElement.classList.remove(systemTheme === "dark" ? "light" : "dark")
        document.documentElement.classList.add(systemTheme)
        if (attribute === "class" && !disableTransitionOnChange) {
          setTimeout(() => document.documentElement.classList.remove("disable-transitions"), 0)
        }
      }
    }

    mediaQuery.addEventListener("change", handleMediaQueryChange)
    handleMediaQueryChange() // Initial check

    return () => mediaQuery.removeEventListener("change", handleMediaQueryChange)
  }, [theme, attribute, disableTransitionOnChange])


  React.useEffect(() => {
    if (typeof window === "undefined") return

    let actualTheme: "light" | "dark"
    if (theme === "system") {
      actualTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    } else {
      actualTheme = theme as "light" | "dark"
    }
    
    setResolvedTheme(actualTheme)

    if (attribute === "class" && !disableTransitionOnChange) {
      document.documentElement.classList.add("disable-transitions")
    }
    document.documentElement.classList.remove("light", "dark")
    if (actualTheme) {
      document.documentElement.classList.add(actualTheme)
    }
    if (attribute === "class" && !disableTransitionOnChange) {
      setTimeout(() => document.documentElement.classList.remove("disable-transitions"), 0)
    }

  }, [theme, attribute, disableTransitionOnChange])


  const setTheme = (newTheme: Theme) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, newTheme)
      } catch (e) {
        // Ignore
      }
    }
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
