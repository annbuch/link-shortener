import { useRef, useState } from 'react'
import { Button } from '../Button/Button'
import styles from './LinkForm.module.css'

const ALIAS_PATTERN = /^[A-Za-z0-9_-]{1,30}$/

const isValidUrl = (value) => {
  if (/\s/.test(value)) return false
  try {
    const parsed = new URL(value)
    return Boolean(parsed.hostname)
  } catch {
    return false
  }
}

export function LinkForm({ editingLink, onCreate, onUpdate, onCancel, isAliasTaken }) {
  const [label, setLabel] = useState(editingLink ? editingLink.label : '')
  const [originalUrl, setOriginalUrl] = useState(editingLink ? editingLink.originalUrl : '')
  const [alias, setAlias] = useState(editingLink && editingLink.alias ? editingLink.alias : '')
  const [error, setError] = useState('')

  const urlRef = useRef(null)
  const aliasRef = useRef(null)
  const isEditing = Boolean(editingLink)

  const fail = (message, ref) => {
    setError(message)
    ref.current?.focus()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const url = originalUrl.trim()
    const cleanAlias = alias.trim()

    if (!url) {
      return fail('Укажите оригинальный URL', urlRef)
    }
    if (!/^https?:\/\//i.test(url)) {
      return fail('URL должен начинаться с http:// или https://', urlRef)
    }
    if (!isValidUrl(url)) {
      return fail('Некорректный URL: проверьте адрес (без пробелов, с доменом)', urlRef)
    }
    if (cleanAlias && !ALIAS_PATTERN.test(cleanAlias)) {
      return fail('Алиас: до 30 символов — латиница, цифры, «-» и «_»', aliasRef)
    }
    if (cleanAlias && isAliasTaken(cleanAlias, editingLink?.id)) {
      return fail(`Адрес clk.me/${cleanAlias} уже занят другой ссылкой`, aliasRef)
    }

    const values = {
      label: label.trim() || url,
      originalUrl: url,
      alias: cleanAlias,
    }

    if (isEditing) {
      onUpdate(editingLink.id, values)
    } else {
      onCreate(values)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Оригинальный URL *</span>
        <input
          ref={urlRef}
          className={styles.input}
          type="text"
          value={originalUrl}
          placeholder="https://example.com/very/long/link"
          autoFocus
          onChange={(event) => setOriginalUrl(event.target.value)}
        />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Метка</span>
          <input
            className={styles.input}
            type="text"
            value={label}
            placeholder="Промо-лендинг"
            onChange={(event) => setLabel(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Алиас</span>
          <input
            ref={aliasRef}
            className={styles.input}
            type="text"
            value={alias}
            placeholder="my-link"
            onChange={(event) => setAlias(event.target.value)}
          />
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button onClick={onCancel}>Отмена</Button>
        <Button variant="primary" type="submit">
          {isEditing ? 'Сохранить' : 'Добавить ссылку'}
        </Button>
      </div>
    </form>
  )
}
