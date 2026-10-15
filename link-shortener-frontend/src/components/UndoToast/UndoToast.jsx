import { IconClose, IconUndo } from '../Icons/Icons'
import styles from './UndoToast.module.css'

export function UndoToast({ label, onUndo, onClose }) {
  return (
    <div className={styles.toast} role="status">
      <span className={styles.text}>
        Ссылка «<b>{label}</b>» удалена
      </span>
      <div className={styles.actions}>
        <button type="button" className={styles.undo} onClick={onUndo}>
          <IconUndo width={16} height={16} />
          Вернуть
        </button>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Скрыть уведомление"
        >
          <IconClose width={16} height={16} />
        </button>
      </div>
    </div>
  )
}
