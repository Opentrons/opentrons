import { useLayoutEffect, useRef } from 'react'

import type { RefObject } from 'react'

/**
 * After password visibility toggles, restore the caret at the end of the input.
 * Chrome resets selection when the input type changes; a follow-up animation
 * frame covers the case where that reset happens after layout effects.
 */
export function usePlaceCaretAtEndOnToggle(
  inputRef: RefObject<HTMLInputElement | null>,
  showPassword: boolean,
  enabled: boolean,
  onCaretPlaced?: (end: number) => void
): void {
  const isFirstRenderRef = useRef(true)
  const onCaretPlacedRef = useRef(onCaretPlaced)
  onCaretPlacedRef.current = onCaretPlaced

  useLayoutEffect(() => {
    if (!enabled) {
      return
    }
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    const placeCaret = (): void => {
      const input = inputRef.current
      if (input == null) {
        return
      }
      const end = placeCaretAtEnd(input)
      onCaretPlacedRef.current?.(end)
    }

    placeCaret()
    const frameId = window.requestAnimationFrame(placeCaret)
    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [showPassword, enabled, inputRef])
}

/**
 * Focus the input and put the caret at the end of its value.
 * Changing an input between type="password" and type="text" resets the caret
 * to the start in Chrome; call this after that type change.
 */
function placeCaretAtEnd(input: HTMLInputElement): number {
  const end = input.value.length
  input.focus()
  input.setSelectionRange(end, end)
  return end
}
