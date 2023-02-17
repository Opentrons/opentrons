import { useState, useEffect, useRef } from 'react'

const USER_EVENTS: Array<keyof DocumentEventMap> = [
  'click',
  'dblclick',
  'keypress',
  'mousemove',
  'pointerover',
  'pointerenter',
  'pointerdown',
  'pointermove',
  'pointerout',
  'pointerleave',
  'scroll',
  'touchmove',
  'touchstart',
  'touchend',
]

const DEFAULT_OPTIONS = {
  events: USER_EVENTS,
  initialState: false,
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useIdle(
  idleTime: number,
  options?: Partial<{
    events: Array<keyof DocumentEventMap>
    initialState: boolean
  }>
) {
  const { events, initialState } = { ...DEFAULT_OPTIONS, ...options }
  const [idle, setIdle] = useState<boolean>(initialState)
  const idleTimer = useRef<number>()

  useEffect(() => {
    const handleEvents = (): void => {
      setIdle(false)

      if (idleTimer.current != null) {
        window.clearTimeout(idleTimer.current)
      }

      idleTimer.current = window.setTimeout(() => {
        setIdle(true)
      }, idleTime)
    }

    events.forEach(event => document.addEventListener(event, handleEvents))

    return () => {
      events.forEach(event => document.removeEventListener(event, handleEvents))
    }
  }, [events, idleTime])

  return idle
}
