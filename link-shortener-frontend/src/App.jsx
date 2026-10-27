import { useEffect, useMemo, useState } from 'react'
import styles from './App.module.css'
import { useDebounce } from './hooks/useDebounce'
import { useTheme } from './hooks/useTheme'
import { getLinkCode } from './utils/shortCode'
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
import { useAuth } from './context/AuthContext'
import { AuthPage } from './components/Auth/AuthPage'
import * as linksApi from './api/links'

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

function App() {
  const [theme, setTheme] = useTheme()
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth()

  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
  useEffect(() => { n    if (!lastDeleted) return undefined n    const timer = setTimeout(() => setLastDeleted(null), 6000) n    if (authLoading) { n    return ( n      <div className={styles.app}> n        <div className={styles.loading}> n          <div className={styles.spinner} /> n        </div> n      </div> n    ) n  } n n  if (!isAuthenticated) { n    return <AuthPage /> n  } n n  return () => clearTimeout(timer) n  }, [lastDeleted]) n n  if (authLoading) {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage />
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
            <span className={styles.subtitle}>Сервис сокращения ссылок с аналитикой</span>
          </div>
        </div>

        <div className={styles.tools}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{user?.email || ''}</span>
          <ThemeSwitcher theme={theme} onChange={setTheme} />
          <Button onClick={logout}>Выйти</Button>
          <Button variant="primary" onClick={openCreate} disabled={loading}>
            <IconPlus width={18} height={18} />
            Добавить ссылку
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
