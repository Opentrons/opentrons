import { useEffect } from 'react'

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
  'mousedown',
]

/**
 * Calls onActivity whenever there is user activity in the app.
 */
export function useActivityListener(
  onActivity: () => void,
  events: Array<keyof DocumentEventMap> = USER_EVENTS
): void {
  useEffect(() => {
    events.forEach(event => {
      document.addEventListener(event, onActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, onActivity)
      })
    }
  }, [onActivity, events])
}
