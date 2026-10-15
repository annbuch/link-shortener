import { IconSearch } from '../Icons/Icons'
import { Select } from '../Select/Select'
import styles from './LinkFilters.module.css'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: 'Активные' },
  { value: 'inactive', label: 'Выключенные' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
  { value: 'clicks', label: 'По кликам' },
  { value: 'label', label: 'По алфавиту' },
]

export function LinkFilters({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  total,
  visible,
}) {
  return (
    <div className={styles.bar}>
      <div className={styles.searchWrap}>
        <IconSearch className={styles.searchIcon} width={17} height={17} />
        <input
          className={styles.search}
          type="search"
          value={query}
          placeholder="Поиск: метка, URL или короткий адрес"
          aria-label="Поиск ссылок"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      <Select
        value={statusFilter}
        options={STATUS_OPTIONS}
        onChange={onStatusFilterChange}
        ariaLabel="Фильтр по статусу"
      />

      <Select
        value={sortBy}
        options={SORT_OPTIONS}
        onChange={onSortByChange}
        ariaLabel="Сортировка"
      />

      <p className={styles.summary}>
        Показано <span className={styles.count}>{visible}</span> из{' '}
        <span className={styles.count}>{total}</span>
      </p>
    </div>
  )
}
