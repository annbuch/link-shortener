import { useEffect, useMemo, useState } from 'react'
import styles from './App.module.css'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useDebounce } from './hooks/useDebounce'
import { useTheme } from './hooks/useTheme'
import { seedLinks } from './data/seedLinks'
import { generateShortCode } from './utils/shortCode'
import { Button } from './components/Button/Button'
import { LinkForm } from './components/LinkForm/LinkForm'
import { LinkFilters } from './components/LinkFilters/LinkFilters'
import { LinkList } from './components/LinkList/LinkList'
import { Modal } from './components/Modal/Modal'
import { Stats } from './components/Stats/Stats'
import { ThemeSwitcher } from './components/ThemeSwitcher/ThemeSwitcher'
import { UndoToast } from './components/UndoToast/UndoToast'
import { IconAlert, IconLink, IconPlus } from './components/Icons/Icons'

const STORAGE_KEY = 'clickme.links.v1'
const AUTOSAVE_KEY = 'clickme.links.autosave'

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

function App() {
  // Тема оформления (prototypes) — хранится в localStorage.
  const [theme, setTheme] = useTheme()

  // Основной список ссылок синхронизируется с localStorage.
  const [links, setLinks] = useLocalStorage(STORAGE_KEY, seedLinks)

  // Состояние интерфейса.
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [isEditorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Подтверждение удаления и последнее удаление (для отмены).
  const [pendingDelete, setPendingDelete] = useState(null)
  const [lastDeleted, setLastDeleted] = useState(null)

  const editingLink = links.find((link) => link.id === editingId) || null

  // Доп. эффект 1: имитация загрузки с сервера (задержка 1 секунда) при монтировании.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Доп. эффект 2: динамический заголовок страницы по количеству ссылок.
  useEffect(() => {
    document.title = `Click.me — ${links.length} ссылок`
  }, [links.length])

  // Доп. эффект 3: автосохранение с debounce (500 мс после последнего изменения).
  const debouncedLinks = useDebounce(links, 500)
  useEffect(() => {
    window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(debouncedLinks))
  }, [debouncedLinks])

  // Доп. эффект: плашка «Вернуть» автоматически скрывается через 6 секунд.
  useEffect(() => {
    if (!lastDeleted) return undefined
    const timer = setTimeout(() => setLastDeleted(null), 6000)
    return () => clearTimeout(timer)
  }, [lastDeleted])

  // Фильтрация и сортировка списка (пересчёт только при изменении зависимостей).
  const visibleLinks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    let result = links

    if (normalized) {
      result = result.filter(
        (link) =>
          link.label.toLowerCase().includes(normalized) ||
          link.originalUrl.toLowerCase().includes(normalized) ||
          (link.alias || '').toLowerCase().includes(normalized),
      )
    }

    if (statusFilter === 'active') {
      result = result.filter((link) => link.isActive)
    } else if (statusFilter === 'inactive') {
      result = result.filter((link) => !link.isActive)
    }

    const sorted = [...result]
    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => a.createdAt - b.createdAt)
        break
      case 'clicks':
        sorted.sort((a, b) => b.clicks - a.clicks)
        break
      case 'label':
        sorted.sort((a, b) => a.label.localeCompare(b.label, 'ru'))
        break
      default:
        sorted.sort((a, b) => b.createdAt - a.createdAt)
    }
    return sorted
  }, [links, query, statusFilter, sortBy])

  // Управление модальным окном добавления/редактирования.
  const openCreate = () => {
    setEditingId(null)
    setEditorOpen(true)
  }

  const openEdit = (id) => {
    setEditingId(id)
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingId(null)
  }

  // CRUD-операции.
  const handleCreate = (values) => {
    const newLink = {
      id: createId(),
      ...values,
      shortCode: generateShortCode(),
      clicks: 0,
      isActive: true,
      createdAt: Date.now(),
    }
    setLinks((prev) => [newLink, ...prev])
    closeEditor()
  }

  const handleUpdate = (id, values) => {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, ...values } : link)))
    closeEditor()
  }

  const requestDelete = (id) => {
    setPendingDelete(links.find((link) => link.id === id) || null)
  }

  const cancelDelete = () => {
    setPendingDelete(null)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    const index = links.findIndex((link) => link.id === pendingDelete.id)
    setLinks((prev) => prev.filter((link) => link.id !== pendingDelete.id))
    setLastDeleted({ link: pendingDelete, index })
    setPendingDelete(null)
  }

  // Возврат удалённой ссылки на прежнее место.
  const undoDelete = () => {
    if (!lastDeleted) return
    setLinks((prev) => {
      const next = [...prev]
      const at =
        lastDeleted.index >= 0 && lastDeleted.index <= next.length ? lastDeleted.index : 0
      next.splice(at, 0, lastDeleted.link)
      return next
    })
    setLastDeleted(null)
  }

  const handleToggle = (id) => {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, isActive: !link.isActive } : link)),
    )
  }

  const handleVisit = (id) => {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, clicks: link.clicks + 1 } : link)),
    )
  }

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <IconLink width={24} height={24} />
          </span>
          <div className={styles.brandText}>
            <h1 className={styles.title}>Click.me</h1>
            <span className={styles.subtitle}>Сервис для сокращения ссылок с аналитикой переходов</span>
          </div>
        </div>

        <div className={styles.tools}>
          <ThemeSwitcher theme={theme} onChange={setTheme} />
          <Button variant="primary" onClick={openCreate}>
            <IconPlus width={18} height={18} />
            Новая ссылка
          </Button>
        </div>
      </header>

      <Stats links={links} />

      <LinkFilters
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        total={links.length}
        visible={visibleLinks.length}
      />

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          Загрузка данных…
        </div>
      ) : (
        <LinkList
          links={visibleLinks}
          hasAny={links.length > 0}
          onEdit={openEdit}
          onDelete={requestDelete}
          onToggle={handleToggle}
          onVisit={handleVisit}
        />
      )}

      {isEditorOpen && (
        <Modal
          title={editingLink ? 'Редактирование ссылки' : 'Новая ссылка'}
          onClose={closeEditor}
        >
          <LinkForm
            editingLink={editingLink}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onCancelEdit={closeEditor}
          />
        </Modal>
      )}

      {pendingDelete && (
        <Modal title="Удаление ссылки" onClose={cancelDelete}>
          <div className={styles.confirm}>
            <span className={styles.confirmIcon}>
              <IconAlert width={26} height={26} />
            </span>
            <p className={styles.confirmText}>
              Удалить ссылку «<b>{pendingDelete.label}</b>»? Её можно будет вернуть в течение
              нескольких секунд после удаления.
            </p>
            <div className={styles.confirmActions}>
              <Button variant="ghost" onClick={cancelDelete}>
                Отмена
              </Button>
              <Button variant="dangerSolid" onClick={confirmDelete}>
                Удалить
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {lastDeleted && (
        <UndoToast
          label={lastDeleted.link.label}
          onUndo={undoDelete}
          onClose={() => setLastDeleted(null)}
        />
      )}
    </div>
  )
}

export default App
