/**
 * A custom hook that detects whether an HTMLElement is being scrolled.
 *
 * @param {RefObject<HTMLElement>} ref - A ref object containing the HTMLElement to monitor for scrolling.
 * @returns {boolean} - A boolean indicating whether the HTMLElement is being scrolled.
 */
import { useState, useEffect, RefObject } from 'react'

export function useScrolling(ref: RefObject<HTMLElement>): boolean {
  const [isScrolling, setIsScrolling] = useState<boolean>(false)

  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null
    const currentRef = ref.current // Copy ref.current to a variable

    if (currentRef != null) {
      currentRef.addEventListener('scroll', () => {
        if (scrollTimeout !== null) clearTimeout(scrollTimeout)
        setIsScrolling(true)
        scrollTimeout = setTimeout(function () {
          setIsScrolling(false)
        }, 100)
      })
    }

    return () => {
      if (currentRef != null) {
        currentRef.removeEventListener('scroll', e => {
          setIsScrolling(false)
        })
      }
    }
  }, [ref])

  return isScrolling
}
