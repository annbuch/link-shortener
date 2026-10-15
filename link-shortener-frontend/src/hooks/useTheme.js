import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

// Список доступных тем. Первая — по умолчанию.
// "dark" — тёмная неоновая (фиолетовый неон).
// "light"  — светлая, приглушённая, с фиолетовыми акцентами и стеклянными поверхностями.
export const THEMES = [
  { id: 'dark', label: 'Dark', hint: 'Тёмная: фиолетовый неон' },
  { id: 'light', label: 'Light', hint: 'Светлая: фиолетовый, стекло, приглушённый фон' },
]

const DEFAULT_THEME = THEMES[0].id

// Хранит выбранную тему в localStorage и проставляет её в data-theme на <html>.
// Если в localStorage остался id удалённой темы — используем тему по умолчанию.
export function useTheme() {
  const [stored, setTheme] = useLocalStorage('clickme.theme', DEFAULT_THEME)
  const theme = THEMES.some((item) => item.id === stored) ? stored : DEFAULT_THEME

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return [theme, setTheme]
}
