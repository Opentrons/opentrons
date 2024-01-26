/**
 * A custom hook that detects whether an HTMLElement is being scrolled.
 *
 * @param {RefObject<HTMLElement>} ref - A ref object containing the HTMLElement to monitor for scrolling.
 * @returns {boolean} - A boolean indicating whether the HTMLElement is being scrolled.
 */
import { useState, useEffect, useRef } from 'react'
import type { RefObject } from 'react'

export const useScrolling = (ref: RefObject<HTMLElement>): boolean => {
  const [isScrolling, setIsScrolling] = useState<boolean>(false)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const element = ref.current

    if (element != null) {
      const handleScroll = (): void => {
        setIsScrolling(true)
        if (scrollTimeout.current != null) clearTimeout(scrollTimeout.current)
        scrollTimeout.current = setTimeout(() => setIsScrolling(false), 100)
      }

      element.addEventListener('scroll', handleScroll)

      return () => {
        if (scrollTimeout.current != null) clearTimeout(scrollTimeout.current)
        element.removeEventListener('scroll', handleScroll)
      }
    }
  }, [ref])

  return isScrolling
}
