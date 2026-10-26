import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

interface SettingsStore {
  theme: ThemeMode
  currency: 'BRL' | 'USD' | 'EUR'
  notifications: boolean
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  setCurrency: (currency: 'BRL' | 'USD' | 'EUR') => void
  setNotifications: (enabled: boolean) => void
}

const applyThemeToDOM = (theme: ThemeMode) => {
  if (typeof window === 'undefined') return

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (isDark) {
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
  }

  // Update meta theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]')
  if (metaTheme) {
    metaTheme.setAttribute('content', isDark ? '#090d16' : '#4f46e5')
  }
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      theme: 'dark', // Default to sleek dark mode as requested by user
      currency: 'BRL',
      notifications: true,

      setTheme: (theme) => {
        set({ theme })
        applyThemeToDOM(theme)
      },

      toggleTheme: () => {
        const current = get().theme
        const isCurrentlyDark =
          current === 'dark' ||
          (current === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        const nextTheme: ThemeMode = isCurrentlyDark ? 'light' : 'dark'
        set({ theme: nextTheme })
        applyThemeToDOM(nextTheme)
      },

      setCurrency: (currency) => set({ currency }),
      setNotifications: (notifications) => set({ notifications }),
    }),
    {
      name: 'aura-fin-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.theme)
        }
      },
    }
  )
)

// Apply immediately on script load if browser window exists
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('aura-fin-settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state?.theme) {
        applyThemeToDOM(parsed.state.theme)
      } else {
        applyThemeToDOM('dark')
      }
    } else {
      applyThemeToDOM('dark')
    }
  } catch {
    applyThemeToDOM('dark')
  }

  // System theme listener
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      const current = useSettingsStore.getState().theme
      if (current === 'system') {
        applyThemeToDOM('system')
      }
    })
}
