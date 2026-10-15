import { THEMES } from '../../hooks/useTheme'
import styles from './ThemeSwitcher.module.css'

const SWATCH = {
  dark: 'linear-gradient(135deg, #000000, #c04ddb)',
  light: 'linear-gradient(135deg, #ffffff, #ff4dd2)',
}

export function ThemeSwitcher({ theme, onChange }) {
  return (
    <div className={styles.switcher} role="group" aria-label="Стиль интерфейса">
      {THEMES.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${styles.option} ${theme === item.id ? styles.active : ''}`}
          onClick={() => onChange(item.id)}
          title={item.hint}
          aria-pressed={theme === item.id}
        >
          <span className={styles.dot} style={{ background: SWATCH[item.id] }} />
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
