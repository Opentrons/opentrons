import {
  useState,
  useEffect,
  useRef,
  MutableRefObject,
  CSSProperties,
} from 'react'
import interact from 'interactjs'

interface UseScrollResult {
  ref: MutableRefObject<null>
  style: CSSProperties
  isEnabled: boolean
  enable: () => void
  disable: () => void
}

export const useScroll = (): UseScrollResult => {
  const [isEnabled, setIsEnabled] = useState<boolean>(true)
  const interactiveRef = useRef(null)
  const swipeDirs = ['up', 'down', 'left', 'right']
  const scrollSize = 1

  const scrollWindow = (direction: string): void => {
    //  This supports only scrolling up/down since horizontal gesture would use swipe gesture
    direction === 'up' ? scrollBy(0, scrollSize) : scrollBy(0, -scrollSize)
  }

  const enable = (): void => {
    if (interactiveRef?.current != null) {
      interact((interactiveRef.current as unknown) as HTMLElement)
        .draggable({
          autoScroll: {
            container: window,
          },
        })
        .on('dragend', event => {
          if (!event.swipe) return

          swipeDirs.forEach(
            dir =>
              event.swipe[dir] != null &&
              (dir === 'up' || dir === 'down') &&
              scrollWindow(dir)
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
    enable: () => setIsEnabled(true),
    disable: () => setIsEnabled(false),
  }
}
