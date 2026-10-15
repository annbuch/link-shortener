import { useEffect, useMemo, useState } from 'react'
import styles from './App.module.css'
import { useStoredList } from './hooks/useStoredList'
import { useDebounce } from './hooks/useDebounce'
import { useTheme } from './hooks/useTheme'
import { seedLinks } from './data/seedLinks'
import { generateShortCode, getLinkCode } from './utils/shortCode'
import { pluralize } from './utils/plural'
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
const LOAD_DELAY = 1000

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

function App() {
  const [theme, setTheme] = useTheme()

  const [links, setLinks, loading] = useStoredList(STORAGE_KEY, seedLinks, LOAD_DELAY)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [isEditorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [pendingDelete, setPendingDelete] = useState(null)
  const [lastDeleted, setLastDeleted] = useState(null)

  const editingLink = links.find((link) => link.id === editingId) || null

  useEffect(() => {
    document.title = loading
      ? 'Click.me — загрузка…'
      : `Click.me — ${pluralize(links.length, ['ссылка', 'ссылки', 'ссылок'])}`
  }, [links.length, loading])

  const debouncedLinks = useDebounce(loading ? null : links, 500)
  useEffect(() => {
    if (debouncedLinks === null) return
    window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(debouncedLinks))
  }, [debouncedLinks])

  useEffect(() => {
    if (!lastDeleted) return undefined
    const timer = setTimeout(() => setLastDeleted(null), 6000)
    return () => clearTimeout(timer)
  }, [lastDeleted])

  const visibleLinks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    let result = links

    if (normalized) {
      result = result.filter(
        (link) =>
          link.label.toLowerCase().includes(normalized) ||
          link.originalUrl.toLowerCase().includes(normalized) ||
          getLinkCode(link).toLowerCase().includes(normalized),
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

  const isAliasTaken = (alias, exceptId) =>
    links.some(
      (link) => link.id !== exceptId && getLinkCode(link).toLowerCase() === alias.toLowerCase(),
    )

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
          <Button variant="primary" onClick={openCreate} disabled={loading}>
            <IconPlus width={18} height={18} />
            Новая ссылка
          </Button>
        </div>
      </header>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          Загрузка данных…
        </div>
      ) : (
        <>
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

          <LinkList
            links={visibleLinks}
            hasAny={links.length > 0}
            onEdit={openEdit}
            onDelete={requestDelete}
            onToggle={handleToggle}
            onVisit={handleVisit}
          />
        </>
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
            onCancel={closeEditor}
            isAliasTaken={isAliasTaken}
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
