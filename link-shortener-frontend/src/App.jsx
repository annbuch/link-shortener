import { useCallback, useEffect, useMemo, useState } from 'react'
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

const PAGE_SIZE = 10

const normalizeLink = (link) => ({
  id: link.id,
  label: link.alias || link.shortCode || link.originalUrl,
  originalUrl: link.originalUrl,
  alias: link.alias || '',
  shortCode: link.shortCode || '',
  clicks: link.clicks || 0,
  isActive: link.isActive !== undefined ? link.isActive : true,
  createdAt: link.createdAt ? new Date(link.createdAt).getTime() : Date.now(),
})

const buildPageList = (current, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'gap-end', totalPages]
  }
  if (current >= totalPages - 3) {
    return [
      1,
      'gap-start',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }
  return [1, 'gap-start', current - 1, current, current + 1, 'gap-end', totalPages]
}

function App() {
  const [theme, setTheme] = useTheme()
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth()

  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [isEditorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [pendingDelete, setPendingDelete] = useState(null)
  const [lastDeleted, setLastDeleted] = useState(null)
  const [draft, setDraft] = useState(null)

  const editingLink = links.find((link) => link.id === editingId) || null
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchLinks = useCallback(
    async (searchQuery = '', pageNumber = 1) => {
      if (!isAuthenticated) return
      setLoading(true)
      setError('')
      try {
        const params = { page: pageNumber, limit: PAGE_SIZE }
        if (searchQuery && searchQuery.trim()) {
          params.search = searchQuery.trim()
        }
        const response = await linksApi.getAllLinks(params)
        const payload = response.data
        let items = []
        let totalCount = 0

        if (Array.isArray(payload)) {
          items = payload
          totalCount = payload.length
        } else if (payload && Array.isArray(payload.items)) {
          items = payload.items
          totalCount = payload.total || items.length
        }

        setLinks(items.map(normalizeLink))
        setTotal(totalCount)
        setPage(pageNumber)
      } catch (err) {
        const message = err.response?.data?.error || err.response?.data?.message || err.message
        setError(message || 'Не удалось загрузить ссылки')
      } finally {
        setLoading(false)
      }
    },
    [isAuthenticated],
  )

  useEffect(() => {
    document.title = loading
      ? 'Click.me — загрузка…'
      : `Click.me — ${pluralize(total || links.length, ['ссылка', 'ссылки', 'ссылок'])}`
  }, [links.length, loading, total])

  // Сброс состояния при выходе из аккаунта
  useEffect(() => {
    if (authLoading || isAuthenticated) return
    setLinks([])
    setTotal(0)
    setPage(1)
    setError('')
    setLoading(false)
  }, [authLoading, isAuthenticated])

  const debouncedQuery = useDebounce(query, 500)

  // Загрузка первой страницы при входе в аккаунт и при изменении поискового запроса
  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    fetchLinks(debouncedQuery, 1)
  }, [authLoading, isAuthenticated, debouncedQuery, fetchLinks])

  useEffect(() => {
    if (!lastDeleted) return undefined
    const timer = setTimeout(() => setLastDeleted(null), 6000)
    return () => clearTimeout(timer)
  }, [lastDeleted])

  const visibleLinks = useMemo(() => {
    let result = links

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
  }, [links, statusFilter, sortBy])

  const goToPage = (pageNumber) => {
    if (pageNumber === page || pageNumber < 1 || pageNumber > totalPages) return
    fetchLinks(debouncedQuery, pageNumber)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const openCreate = () => {
    setDraft(null)
    setEditingId(null)
    setEditorOpen(true)
  }

  const openEdit = (id) => {
    setDraft(null)
    setEditingId(id)
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingId(null)
    setDraft(null)
  }

  const isAliasTaken = (alias, exceptId) =>
    links.some(
      (link) => link.id !== exceptId && getLinkCode(link).toLowerCase() === alias.toLowerCase(),
    )

  // Добавление: оптимистично вставляем элемент, при ошибке откатываем и возвращаем форму
  const handleCreate = async (values) => {
    if (!isAuthenticated) return
    const tempId = `tmp-${Date.now()}`
    const optimistic = {
      id: tempId,
      label: values.label || values.alias || values.originalUrl,
      originalUrl: values.originalUrl,
      alias: values.alias || '',
      shortCode: values.alias || '',
      clicks: 0,
      isActive: true,
      createdAt: Date.now(),
    }

    setLinks((prev) => [optimistic, ...prev])
    setTotal((prev) => prev + 1)
    closeEditor()

    try {
      await linksApi.createLink({
        originalUrl: values.originalUrl,
        alias: values.alias || undefined,
      })
      // По требованию: после создания перезагружаем первую страницу с текущим поиском
      await fetchLinks(debouncedQuery, 1)
    } catch (err) {
      setLinks((prev) => prev.filter((link) => link.id !== tempId))
      setTotal((prev) => Math.max(0, prev - 1))
      setDraft(values)
      setEditorOpen(true)
      const message =
        err.response?.data?.error || err.response?.data?.message || 'Не удалось создать ссылку'
      setError(message)
    }
  }

  // Редактирование: оптимистично применяем значения, при ошибке откатываем
  const handleUpdate = async (id, values) => {
    if (!isAuthenticated) return
    const previous = links.find((link) => link.id === id)
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id
          ? {
              ...link,
              label: values.label || link.label,
              originalUrl: values.originalUrl,
              alias: values.alias,
              shortCode: values.alias || link.shortCode,
            }
          : link,
      ),
    )
    closeEditor()

    try {
      await linksApi.updateLink(id, {
        originalUrl: values.originalUrl,
        alias: values.alias ? values.alias : null,
      })
      await fetchLinks(debouncedQuery, page)
    } catch (err) {
      if (previous) {
        setLinks((prev) => prev.map((link) => (link.id === id ? previous : link)))
      }
      setEditingId(id)
      setDraft(values)
      setEditorOpen(true)
      const message =
        err.response?.data?.error || err.response?.data?.message || 'Не удалось обновить ссылку'
      setError(message)
    }
  }

  const requestDelete = (id) => {
    setPendingDelete(links.find((link) => link.id === id) || null)
  }

  const cancelDelete = () => {
    setPendingDelete(null)
  }

  // Удаление: оптимистично убираем элемент, при ошибке возвращаем на прежнее место
  const confirmDelete = async () => {
    if (!pendingDelete || !isAuthenticated) return
    const target = pendingDelete
    const index = links.findIndex((link) => link.id === target.id)
    const wasLastOnPage = links.length === 1

    setPendingDelete(null)
    setLinks((prev) => prev.filter((link) => link.id !== target.id))
    setTotal((prev) => Math.max(0, prev - 1))
    setLastDeleted({ link: target, index })

    try {
      await linksApi.deleteLink(target.id)
      const nextPage = wasLastOnPage && page > 1 ? page - 1 : page
      await fetchLinks(debouncedQuery, nextPage)
    } catch (err) {
      setLinks((prev) => {
        const next = [...prev]
        next.splice(Math.max(0, Math.min(index, next.length)), 0, target)
        return next
      })
      setTotal((prev) => prev + 1)
      setLastDeleted(null)
      const message =
        err.response?.data?.error || err.response?.data?.message || 'Не удалось удалить ссылку'
      setError(message)
    }
  }

  // Отмена удаления: оптимистично возвращаем элемент и восстанавливаем его на сервере
  const undoDelete = async () => {
    if (!lastDeleted || !isAuthenticated) return
    const { link, index } = lastDeleted
    setLastDeleted(null)
    setLinks((prev) => {
      const next = [...prev]
      next.splice(Math.max(0, Math.min(index, next.length)), 0, link)
      return next
    })
    setTotal((prev) => prev + 1)

    try {
      await linksApi.restoreLink(link.id)
      await fetchLinks(debouncedQuery, page)
    } catch (err) {
      setLinks((prev) => prev.filter((item) => item.id !== link.id))
      setTotal((prev) => Math.max(0, prev - 1))
      const message =
        err.response?.data?.error || err.response?.data?.message || 'Не удалось восстановить ссылку'
      setError(message)
    }
  }

  const handleToggle = async (id) => {
    if (!isAuthenticated) return
    const target = links.find((link) => link.id === id)
    if (!target) return
    const nextActive = !target.isActive
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, isActive: nextActive } : link)),
    )
    try {
      if (nextActive) {
        await linksApi.activateLink(id)
      } else {
        await linksApi.deactivateLink(id)
      }
    } catch (err) {
      setLinks((prev) =>
        prev.map((link) => (link.id === id ? { ...link, isActive: target.isActive } : link)),
      )
      const message =
        err.response?.data?.error || err.response?.data?.message || 'Не удалось изменить статус'
      setError(message)
    }
  }

  const handleVisit = (id) => {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, clicks: link.clicks + 1 } : link)),
    )
  }

  if (authLoading) {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          Загрузка профиля…
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
            <span className={styles.subtitle}>
              Сервис для сокращения ссылок с аналитикой переходов
            </span>
          </div>
        </div>

        <div className={styles.tools}>
          {user?.email && <span className={styles.userEmail}>{user.email}</span>}
          <ThemeSwitcher theme={theme} onChange={setTheme} />
          <Button onClick={logout}>Выйти</Button>
          <Button variant="primary" onClick={openCreate} disabled={loading}>
            <IconPlus width={18} height={18} />
            Новая ссылка
          </Button>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <Button variant="ghost" onClick={() => fetchLinks(debouncedQuery, page)}>
            Повторить
          </Button>
        </div>
      )}

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
            total={total}
            visible={visibleLinks.length}
          />

          <LinkList
            links={visibleLinks}
            hasAny={total > 0}
            onEdit={openEdit}
            onDelete={requestDelete}
            onToggle={handleToggle}
            onVisit={handleVisit}
          />

          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Пагинация">
              <button
                type="button"
                className={styles.pageArrow}
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                aria-label="Предыдущая страница"
              >
                ‹
              </button>

              {buildPageList(page, totalPages).map((item) =>
                typeof item === 'number' ? (
                  <button
                    key={item}
                    type="button"
                    className={
                      item === page ? `${styles.pageBtn} ${styles.pageBtnActive}` : styles.pageBtn
                    }
                    onClick={() => goToPage(item)}
                    aria-current={item === page ? 'page' : undefined}
                  >
                    {item}
                  </button>
                ) : (
                  <span key={item} className={styles.pageGap}>
                    …
                  </span>
                ),
              )}

              <button
                type="button"
                className={styles.pageArrow}
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                aria-label="Следующая страница"
              >
                ›
              </button>
            </nav>
          )}
        </>
      )}

      {isEditorOpen && (
        <Modal
          title={editingLink ? 'Редактирование ссылки' : 'Новая ссылка'}
          onClose={closeEditor}
        >
          <LinkForm
            editingLink={editingLink}
            initialValues={draft}
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
