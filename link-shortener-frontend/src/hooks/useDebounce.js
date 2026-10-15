import { useEffect, useState } from 'react'

// Пользовательский хук debounce: возвращает значение, которое обновляется
// только после того, как исходное значение не менялось `delay` миллисекунд.
// Используется для автосохранения (Часть 4 задания).
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    // Очистка таймера: при новом изменении предыдущий таймер отменяется
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
