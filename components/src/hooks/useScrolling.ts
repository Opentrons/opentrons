import { useState, useEffect, RefObject } from 'react'

export const useScrolling = (ref: RefObject<HTMLElement>): boolean => {
  const [isScrolling, setIsScrolling] = useState<boolean>(false)

  useEffect(() => {
    if (ref.current != null) {
      let scrollingTimeout: NodeJS.Timeout

      const handleScrollEnd = (): void => {
        setIsScrolling(false)
      }

      const handleScroll = (): void => {
        setIsScrolling(true)
        clearTimeout(scrollingTimeout)
        scrollingTimeout = setTimeout(() => handleScrollEnd, 1000)
      }

      window.addEventListener('scroll', handleScroll)
      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    }
    return () => {}
  }, [ref])

  return isScrolling
}
