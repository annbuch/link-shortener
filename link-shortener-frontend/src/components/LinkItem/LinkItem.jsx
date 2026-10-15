import { useState } from 'react'
import { buildShortUrl } from '../../utils/shortCode'
import { useTilt } from '../../hooks/useTilt'
import { Button } from '../Button/Button'
import {
  IconCheck,
  IconCopy,
  IconCursor,
  IconEdit,
  IconExternal,
  IconPower,
  IconTrash,
} from '../Icons/Icons'
import styles from './LinkItem.module.css'

const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

// Карточка одной ссылки: короткий адрес, копирование, оригинал, клики и действия.
//
// Включение/выключение ссылки: «выключенная» ссылка закрыта для переходов —
// по короткому адресу перейти нельзя (в реальном сервисе отдаётся заглушка),
// для этого короткий адрес и кнопка «открыть оригинал» становятся неактивными.
export function LinkItem({ link, onEdit, onDelete, onToggle, onVisit }) {
  const [copied, setCopied] = useState(false)
  const tilt = useTilt()
  const shortUrl = buildShortUrl(link)
  const active = link.isActive

  // Копирование короткого адреса в буфер обмена (иконка меняется на «галочку»).
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${shortUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.warn('Не удалось скопировать ссылку:', error)
    }
  }

  return (
    <li className={`${styles.item} ${active ? '' : styles.off}`} {...tilt}>
      <div className={styles.head}>
        <h3 className={styles.label} title={link.label}>
          {link.label}
        </h3>
        <span
          className={`${styles.badge} ${active ? styles.badgeOn : styles.badgeOff}`}
          title={
            active
              ? 'Ссылка включена: переход по короткому адресу работает'
              : 'Ссылка выключена: переход по короткому адресу закрыт'
          }
        >
          {active ? 'Активна' : 'Выключена'}
        </span>
      </div>

      <div className={styles.short}>
        {active ? (
          <a
            className={styles.shortUrl}
            href={link.originalUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => onVisit(link.id)}
          >
            {shortUrl}
          </a>
        ) : (
          <span
            className={`${styles.shortUrl} ${styles.shortUrlOff}`}
            title="Ссылка выключена — переход по короткому адресу недоступен"
          >
            {shortUrl}
          </span>
        )}

        <Button
          variant="ghost"
          size="iconSm"
          onClick={handleCopy}
          title={copied ? 'Скопировано' : 'Копировать'}
          aria-label="Копировать короткую ссылку"
        >
          {copied ? <IconCheck /> : <IconCopy />}
        </Button>

        {active ? (
          <a
            className={styles.iconLink}
            href={link.originalUrl}
            target="_blank"
            rel="noreferrer"
            title="Открыть оригинал"
            aria-label="Открыть оригинал"
            onClick={() => onVisit(link.id)}
          >
            <IconExternal width={16} height={16} />
          </a>
        ) : (
          <span
            className={`${styles.iconLink} ${styles.iconLinkOff}`}
            title="Ссылка выключена"
            aria-disabled="true"
          >
            <IconExternal width={16} height={16} />
          </span>
        )}
      </div>

      <p className={styles.original} title={link.originalUrl}>
        {link.originalUrl}
      </p>

      <div className={styles.meta}>
        <span className={styles.clicks}>
          <IconCursor width={15} height={15} />
          {link.clicks} кликов
        </span>
        <span>создана {formatDate(link.createdAt)}</span>
      </div>

      <div className={styles.actions}>
        <Button
          size="iconSm"
          onClick={() => onEdit(link.id)}
          title="Изменить"
          aria-label="Изменить"
        >
          <IconEdit />
        </Button>

        <Button
          size="sm"
          onClick={() => onToggle(link.id)}
          title={
            active
              ? 'Выключить ссылку — переход по короткому адресу закроется'
              : 'Включить ссылку — переход по короткому адресу снова заработает'
          }
          aria-label={active ? 'Выключить ссылку' : 'Включить ссылку'}
        >
          <IconPower width={15} height={15} />
          {active ? 'Выключить' : 'Включить'}
        </Button>

        <span className={styles.spacer} />

        <Button
          variant="ghost"
          size="iconSm"
          className={styles.delete}
          onClick={() => onDelete(link.id)}
          title="Удалить"
          aria-label="Удалить"
        >
          <IconTrash />
        </Button>
      </div>
    </li>
  )
}
