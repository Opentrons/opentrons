// @flow
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

export type UseHoverOptions = $Shape<{|
  enterDelay?: number,
  leaveDelay?: number,
|}>

export type HoverHandlers = {|
  onMouseEnter: () => mixed,
  onMouseLeave: () => mixed,
|}

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
  const timeoutRef = useRef()

  const handleHoverChange = useCallback((value, delay) => {
    clearTimeout(timeoutRef.current)
    if (delay) {
      timeoutRef.current = setTimeout(() => setHovered(value), delay)
    } else {
      setHovered(value)
    }
  }, [])

  const handlers = useMemo(
    () => ({
      onMouseEnter: () => handleHoverChange(true, enterDelay),
      onMouseLeave: () => handleHoverChange(false, leaveDelay),
    }),
    [handleHoverChange, enterDelay, leaveDelay]
  )

  // cleanup timeout on unmount
  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  return [hovered, handlers]
}
