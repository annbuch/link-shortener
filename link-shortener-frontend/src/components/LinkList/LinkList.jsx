import { IconLink, IconSearch } from '../Icons/Icons'
import { LinkItem } from '../LinkItem/LinkItem'
import styles from './LinkList.module.css'

export function LinkList({ links, hasAny, onEdit, onDelete, onToggle, onVisit }) {
  if (links.length === 0) {
    return (
      <div className={styles.empty}>
        {hasAny ? <IconSearch width={34} height={34} /> : <IconLink width={34} height={34} />}
        <p className={styles.emptyTitle}>
          {hasAny ? 'Ничего не найдено' : 'Ссылок пока нет'}
        </p>
        <span>
          {hasAny
            ? 'Измените поисковый запрос или фильтр.'
            : 'Нажмите «Новая ссылка», чтобы добавить первую.'}
        </span>
      </div>
    )
  }

  return (
    <ul className={styles.list}>
      {links.map((link) => (
        <LinkItem
          key={link.id}
          link={link}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
          onVisit={onVisit}
        />
      ))}
    </ul>
  )
}
