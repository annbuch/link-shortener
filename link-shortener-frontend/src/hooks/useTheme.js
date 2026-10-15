import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export const THEMES = [
  { id: 'dark', label: 'Dark', hint: 'Тёмная: фиолетовый неон' },
  { id: 'light', label: 'Light', hint: 'Светлая: фиолетовый, стекло, приглушённый фон' },
]

const DEFAULT_THEME = THEMES[0].id

export function useTheme() {
  const [stored, setTheme] = useLocalStorage('clickme.theme', DEFAULT_THEME)
  const theme = THEMES.some((item) => item.id === stored) ? stored : DEFAULT_THEME

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return [theme, setTheme]
}
