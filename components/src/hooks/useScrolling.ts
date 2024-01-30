/**
 * A custom hook that detects whether an HTMLElement is being scrolled.
 *
 * @param {HTMLElement | null} node - HTMLElement to monitor for scrolling.
 * @returns {boolean} - A boolean indicating whether the HTMLElement is being scrolled.
 */
import { useState, useEffect, useRef } from 'react'

export const useScrolling = (node: HTMLElement | null): boolean => {
  const [isScrolling, setIsScrolling] = useState<boolean>(false)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (node != null) {
      const handleScroll = (): void => {
        setIsScrolling(true)
        if (scrollTimeout.current != null) clearTimeout(scrollTimeout.current)
        scrollTimeout.current = setTimeout(() => {
          setIsScrolling(false)
        }, 200)
      }

      node?.addEventListener('scroll', handleScroll)

      return () => {
        if (scrollTimeout.current != null) clearTimeout(scrollTimeout.current)
        node?.removeEventListener('scroll', handleScroll)
      }
    }
  }, [node])

  return isScrolling
}
