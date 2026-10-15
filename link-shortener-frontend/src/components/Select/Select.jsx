import { useEffect, useRef, useState } from 'react'
import { IconChevronDown } from '../Icons/Icons'
import styles from './Select.module.css'

// Кастомный выпадающий список в стиле сайта (вместо нативного <select>,
// который нельзя оформить). Управляемый: value + onChange.
export function Select({ value, options, onChange, ariaLabel, className = '' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const current = options.find((option) => option.value === value) || options[0]

  // Закрытие по клику вне и по Escape.
  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const choose = (nextValue) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div className={`${styles.select} ${className}`} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={current.label}
      >
        <span className={styles.value}>{current.label}</span>
        <IconChevronDown className={styles.chevron} width={16} height={16} />
      </button>

      {open && (
        <ul className={styles.menu} role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const selected = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  className={`${styles.item} ${selected ? styles.itemActive : ''}`}
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(option.value)}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
