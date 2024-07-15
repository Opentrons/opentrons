import { useState, useEffect, useRef } from 'react'
import interact from 'interactjs'
import type { MutableRefObject, CSSProperties } from 'react'

interface UseSwipeResult {
  ref: MutableRefObject<null>
  style: CSSProperties
  isEnabled: boolean
  setSwipeType: (value: string) => void
  swipeType: string
  enable: () => void
  disable: () => void
}

export const useSwipe = (): UseSwipeResult => {
  const [swipeType, setSwipeType] = useState<string>('')
  const [isEnabled, setIsEnabled] = useState<boolean>(true)
  const interactiveRef = useRef(null)
  const THRESHOLD = 50
  let startX = 0
  let startY = 0

  const enable = (): void => {
    if (interactiveRef.current != null) {
      interact(interactiveRef.current).draggable({
        inertia: false,
        modifiers: [],
        autoScroll: false,
        listeners: {
          start(event) {
            startX = event.clientX
            startY = event.clientY
          },
          // Note (kk:07/11/2024) want to keep this for debugging
          // move(event) {
          //   console.log('Drag move:', event.clientX, event.clientY)
          // },
          end(event) {
            const dx = event.clientX - startX
            const dy = event.clientY - startY
            const absX = Math.abs(dx)
            const absY = Math.abs(dy)

            if (absX > absY && absX > THRESHOLD) {
              setSwipeType(dx > 0 ? 'swipe-right' : 'swipe-left')
            } else if (absY > absX && absY > THRESHOLD) {
              setSwipeType(dy > 0 ? 'swipe-down' : 'swipe-up')
            }
          },
        },
      })
    }
  }

  const disable = (): void => {
    if (interactiveRef.current != null) {
      interact((interactiveRef.current as unknown) as HTMLElement).unset()
    }
  }

  useEffect(() => {
    if (isEnabled) {
      enable()
    } else {
      disable()
    }
    return disable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled])

  return {
    ref: interactiveRef,
    style: {
      touchAction: 'none',
    },
    isEnabled,
    setSwipeType,
    swipeType,
    enable: () => {
      setIsEnabled(true)
    },
    disable: () => {
      setIsEnabled(false)
    },
  }
}
