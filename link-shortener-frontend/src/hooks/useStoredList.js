import { useEffect, useState } from 'react'

function readList(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key)
    if (stored === null) return fallback
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return fallback
    return parsed.filter((item) => item !== null && typeof item === 'object')
  } catch (error) {
    console.warn(`Не удалось прочитать "${key}" из localStorage:`, error)
    return fallback
  }
}

export function useStoredList(key, initialItems, delay = 0) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(readList(key, initialItems))
      setLoading(false)
    }, delay)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (loading) return
    try {
      window.localStorage.setItem(key, JSON.stringify(items))
    } catch (error) {
      console.warn(`Не удалось сохранить "${key}" в localStorage:`, error)
    }
  }, [key, items, loading])

  return [items, setItems, loading]
}
