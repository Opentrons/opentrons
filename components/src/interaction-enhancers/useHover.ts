import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

export interface UseHoverOptions {
  enterDelay?: number
  leaveDelay?: number
}

export interface HoverHandlers {
  onPointerEnter: () => unknown
  onPointerLeave: () => unknown
}

export type UseHoverResult = [boolean, HoverHandlers]

/**
 * Hook to track hover state of an element
 *
 * @param {UseHoverOptions} [options={}] (add an `enterDelay` or `leaveDelay` to the hover state change)
 * @returns {UseHoverResult}
 * @example
 * ```js
 * import { useHover } from '@opentrons/components'
 *
 * export function HoverComponent() {
 *   const [hovered, hoverHandlers] = useHover({
 *     enterDelay: 300,
 *     leaveDelay: 100
 *   })
 *
 *   return (
 *     <span {...hoverHandlers}>
 *       {hovered ? 'Hovered!' : 'Not hovered!'}
 *     </span>
 *   )
 * }
 * ```
 */
export function useHover(options: UseHoverOptions = {}): UseHoverResult {
  const { enterDelay, leaveDelay } = options
  const [hovered, setHovered] = useState(false)
  const timeoutRef = useRef<number>()

  const handleHoverChange = useCallback((value: boolean, delay: number | undefined) => {
    clearTimeout(timeoutRef.current)
    if (delay) {
      timeoutRef.current = setTimeout(
        // TODO(mc, 2021-03-08): use window.setTimeout or a separate const
        // for the handler to tell TS that we're using DOM setTimeout, not Node.js
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        (() => setHovered(value)) as TimerHandler,
        delay
      )
    } else {
      setHovered(value)
    }
  }, [])

  const handlers = useMemo(
    () => ({
      onPointerEnter: () => handleHoverChange(true, enterDelay),
      onPointerLeave: () => handleHoverChange(false, leaveDelay),
    }),
    [handleHoverChange, enterDelay, leaveDelay]
  )

  // cleanup timeout on unmount
  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  return [hovered, handlers]
}
