import {
  useState,
  useEffect,
  useRef,
  CSSProperties,
  MutableRefObject,
} from 'react'
import interact from 'interactjs'
import type PointerEvent from 'interactjs'

const HOLD_DURATION_MS = 1000

// Note kj 12/05/2022
// ODD needs setIsLongPressed since when a user use long press, ODD app needs to show overflow menu.
// Then if a user takes clicking outside action, the ODD app needs to reset the isLongPressed.
// In terms of setIsTapped, if the ODD app doesn't need it, it will be removed.
export interface UseLongPressResult {
  ref: MutableRefObject<null>
  style: CSSProperties
  isEnabled: boolean
  isLongPressed: boolean
  isTapped: boolean
  setIsLongPressed: (value: boolean) => void
  setIsTapped: (value: boolean) => void
  enable: () => void
  disable: () => void
}

/**
 * useLongPress provide two actions (tap and long press)
 * useLongPress recognize 1 sec hold as long press: hold Duration
 * interactjs recognize "hold" when an element is held down around 600ms(default)
 * @returns {UseLongPressResult}
 */
export const useLongPress = (): UseLongPressResult => {
  const [isLongPressed, setIsLongPressed] = useState<boolean>(false)
  const [isTapped, setIsTapped] = useState<boolean>(false)
  const [isEnabled, setIsEnabled] = useState<boolean>(true)
  const interactiveRef = useRef(null)

  const enable = (): void => {
    if (interactiveRef?.current != null) {
      interact((interactiveRef.current as unknown) as HTMLElement)
        .pointerEvents({
          holdDuration: HOLD_DURATION_MS,
        })
        .on('hold', (event: PointerEvent) => {
          setIsLongPressed(isLongPressed => !isLongPressed)
        })
        .on('tap', (event: PointerEvent) => {
          setIsTapped(isTapped => !isTapped)
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
    isLongPressed,
    isTapped,
    setIsLongPressed,
    setIsTapped,
    enable: () => setIsEnabled(true),
    disable: () => setIsEnabled(false),
  }
}
