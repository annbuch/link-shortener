import { useEffect, useState } from 'react'

// Пользовательский хук: хранит состояние и синхронизирует его с localStorage.
// - Начальное значение читается «лениво» (функция-инициализатор useState),
//   поэтому обращение к localStorage происходит один раз при монтировании.
// - useEffect с зависимостью [value] сохраняет новое значение при каждом изменении.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch (error) {
      console.warn(`Не удалось прочитать "${key}" из localStorage:`, error)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Не удалось сохранить "${key}" в localStorage:`, error)
    }
  }, [key, value])

  return [value, setValue]
}
