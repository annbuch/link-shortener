import { useMemo } from 'react'
import { IconChart, IconCursor, IconEye, IconEyeOff, IconLink } from '../Icons/Icons'
import styles from './Stats.module.css'

export function Stats({ links }) {
  const stats = useMemo(() => {
    const total = links.length
    const active = links.filter((link) => link.isActive).length
    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)
    const topLink = links.reduce(
      (top, link) => (top === null || link.clicks > top.clicks ? link : top),
      null,
    )
    return { total, active, inactive: total - active, totalClicks, topLink }
  }, [links])

  const cards = [
    { key: 'total', icon: <IconLink />, value: stats.total, label: 'Всего ссылок' },
    { key: 'active', icon: <IconEye />, value: stats.active, label: 'Активных' },
    { key: 'inactive', icon: <IconEyeOff />, value: stats.inactive, label: 'Выключенных' },
    { key: 'clicks', icon: <IconCursor />, value: stats.totalClicks, label: 'Всего кликов' },
    {
      key: 'top',
      icon: <IconChart />,
      value: stats.topLink ? stats.topLink.label : '—',
      label: 'Лидер по кликам',
      small: true,
    },
  ]

  return (
    <section className={styles.grid}>
      {cards.map((card) => (
        <article key={card.key} className={styles.card}>
          <span className={styles.icon}>{card.icon}</span>
          <div className={styles.text}>
            <span
              className={card.small ? styles.valueSmall : styles.value}
              title={card.small ? String(card.value) : undefined}
            >
              {card.value}
            </span>
            <span className={styles.label}>{card.label}</span>
          </div>
        </article>
      ))}
    </section>
  )
}
