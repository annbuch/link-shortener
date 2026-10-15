import { useRef, useState } from 'react'
import { Button } from '../Button/Button'
import styles from './LinkForm.module.css'

// Контролируемая форма добавления и редактирования ссылки (используется в модальном окне).
// Поля хранятся в useState; Enter внутри формы отправляет её (submit) — «горячая клавиша».
export function LinkForm({ editingLink, onCreate, onUpdate, onCancelEdit }) {
  const [label, setLabel] = useState(editingLink ? editingLink.label : '')
  const [originalUrl, setOriginalUrl] = useState(editingLink ? editingLink.originalUrl : '')
  const [alias, setAlias] = useState(editingLink && editingLink.alias ? editingLink.alias : '')
  const [error, setError] = useState('')

  const urlRef = useRef(null)
  const isEditing = Boolean(editingLink)

  const handleSubmit = (event) => {
    event.preventDefault()
    const url = originalUrl.trim()

    if (!url) {
      setError('Укажите оригинальный URL')
      urlRef.current?.focus()
      return
    }
    if (!/^https?:\/\/.+/i.test(url)) {
      setError('URL должен начинаться с http:// или https://')
      urlRef.current?.focus()
      return
    }

    const values = {
      label: label.trim() || url,
      originalUrl: url,
      alias: alias.trim(),
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
        {isEditing && <Button onClick={onCancelEdit}>Отмена</Button>}
        <Button variant="primary" type="submit">
          {isEditing ? 'Сохранить' : 'Добавить ссылку'}
        </Button>
      </div>
    </form>
  )
}
