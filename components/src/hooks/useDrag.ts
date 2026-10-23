import { useEffect, useRef, useState } from 'react'
import interact from 'interactjs'

import type { CSSProperties, MutableRefObject } from 'react'

export interface ElementPosition {
  width: number
  height: number
  x: number
  y: number
}

export interface UseDragResult {
  ref: MutableRefObject<null>
  style: CSSProperties
  position: ElementPosition
  isEnabled: boolean
  enable: () => void
  disable: () => void
}

/**
 * useDrag makes HTMLElement draggable for on-device app
 * This hook should be used when isOnDevice is true
 * @param {ElementPosition} (width, height, x, and y, they are HTMLElement's size and the initial position)
 * @returns {UseDragResult}
 */

export const useDrag = (position: ElementPosition): UseDragResult => {
  const [elementPosition, setElementPosition] =
    useState<ElementPosition>(position)
  const [isEnabled, setIsEnabled] = useState<boolean>(true)
  const interactiveRef = useRef(null)

  useEffect(
    () => {
      const element = interactiveRef.current
      if (element == null || !isEnabled) {
        return
      }

      let { x, y, width, height } = elementPosition

      const interactable = interact(element as unknown as HTMLElement)
        .draggable({
          modifiers: [],
          inertia: false,
        })
        .on('dragmove', (event: Interact.InteractEvent) => {
          x += Number(event.dx)
          y += Number(event.dy)

          setElementPosition({
            width,
            height,
            x,
            y,
          })
        })

      return () => {
        interactable.unset()
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEnabled]
  )

  return {
    ref: interactiveRef,
    style: {
      transform: `translate3D(${elementPosition.x}px, ${elementPosition.y}px, 0)`,
      width: `${elementPosition.width}px`,
      height: `${elementPosition.height}px`,
      position: 'absolute' as CSSProperties['position'],
      touchAction: 'none',
    },
    position: elementPosition,
    isEnabled,
    enable: () => {
      setIsEnabled(true)
    },
    disable: () => {
      setIsEnabled(false)
    },
  }
}
