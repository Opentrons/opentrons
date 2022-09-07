import { useState, useEffect, useRef, CSSProperties, MutableRefObject } from 'react'
import interact from "interactjs"
import type PointerEvent from 'interactjs'

interface UseLongPressResult {
    ref: MutableRefObject<null>,
    style: CSSProperties,
    isEnabled: boolean,
    isLongPressed: boolean,
    isTapped: boolean,
    enable: () => void,
    disable: () => void,
}

/**
 * useLongPress provide two actions (tap and long press)
 * useLongPress recognize 3sec hold as long press: holdDuration
 * @returns {UseLongPressResult}
 */
export const useLongPress = (): UseLongPressResult => {
    const [isLongPressed, setIsLongPressed ] = useState<boolean>(false)
    const [isTapped, setIsTapped ] = useState<boolean>(false)
  const [isEnabled, setIsEnabled] = useState<boolean>(true)
  const interactiveRef = useRef(null)

  const enable = (): void => {
    if(interactiveRef?.current != null) {
        interact((interactiveRef.current as unknown) as HTMLElement)
        .pointerEvents({
            holdDuration: 3000,
        })
      .on("hold", (event: PointerEvent) => {
        setIsLongPressed(true)
      })
      // This might be needed but it would depend on how we implement
      .on("tap", (event: PointerEvent) => {
        setIsTapped(true)
      })
    }
  }
  const disable = (): void => {
    if(interactiveRef?.current != null) {
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
      touchAction: "none"
    },
    isEnabled,
    isLongPressed,
    isTapped,
    enable: () => setIsEnabled(true),
    disable: () => setIsEnabled(false)
  }
}