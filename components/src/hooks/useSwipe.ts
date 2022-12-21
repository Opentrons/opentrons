import {
  useState,
  useEffect,
  useRef,
  MutableRefObject,
  CSSProperties,
} from 'react'
import interact from 'interactjs'

interface UseSwipeResult {
  ref: MutableRefObject<null>
  style: CSSProperties
  isEnabled: boolean
  swipeType: string
  enable: () => void
  disable: () => void
}

export const useSwipe = (): UseSwipeResult => {
  const [swipeType, setSwipeType] = useState<string>('')
  const [isEnabled, setIsEnabled] = useState<boolean>(true)
  const interactiveRef = useRef(null)
  const str = 'swipe'
  const swipeDirs = ['up', 'down', 'left', 'right']

  const enable = (): void => {
    if (interactiveRef?.current != null) {
      interact((interactiveRef.current as unknown) as HTMLElement)
        .draggable(true)
        .on('dragend', event => {
          if (!event.swipe) return

          swipeDirs.forEach(
            dir => event.swipe[dir] && setSwipeType(`${str}-${dir}`)
          )
        })
    }
  }
  const disable = (): void => {
    if (interactiveRef?.current != null) {
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
    swipeType,
    enable: () => setIsEnabled(true),
    disable: () => setIsEnabled(false),
  }
}
