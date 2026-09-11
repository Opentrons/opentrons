import { useEffect, useRef, useState } from 'react'
import interact from 'interactjs'

import type { CSSProperties, MutableRefObject } from 'react'

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

  useEffect(() => {
    const element = interactiveRef.current
    if (element == null || !isEnabled) {
      return
    }

    let startX = 0
    let startY = 0

    const interactable = interact(element).draggable({
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

    return () => {
      interactable.unset()
    }
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
