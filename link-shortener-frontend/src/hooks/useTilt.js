import { useCallback } from 'react'

// 3D-наклон элемента за курсором. Возвращает обработчики, которые задают
// CSS-переменные --tilt-x / --tilt-y (в градусах); сама трансформация — в CSS.
export function useTilt(strength = 7) {
  const onMouseMove = useCallback(
    (event) => {
      const el = event.currentTarget
      const rect = el.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width - 0.5
      const py = (event.clientY - rect.top) / rect.height - 0.5
      el.style.setProperty('--tilt-y', `${(px * strength).toFixed(2)}deg`)
      el.style.setProperty('--tilt-x', `${(-py * strength).toFixed(2)}deg`)
    },
    [strength],
  )

  const onMouseLeave = useCallback((event) => {
    const el = event.currentTarget
    el.style.setProperty('--tilt-y', '0deg')
    el.style.setProperty('--tilt-x', '0deg')
  }, [])

  return { onMouseMove, onMouseLeave }
}
