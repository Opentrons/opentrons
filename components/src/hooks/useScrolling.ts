import { useState, useEffect, RefObject } from 'react'

export const useScrolling = (ref: RefObject<HTMLElement>): boolean => {
  const [isScrolling, setIsScrolling] = useState<boolean>(false)

  useEffect(() => {
    const element = ref.current

    if (element != null) {
      let scrollingTimeout: ReturnType<typeof setTimeout>

      const handleScrollEnd = (): void => {
        setIsScrolling(false)
      }

      const handleScroll = (): void => {
        setIsScrolling(true)
        clearTimeout(scrollingTimeout)
        scrollingTimeout = setTimeout(handleScrollEnd, 200)
      }

      element.addEventListener('scroll', handleScroll)
      return () => {
        element.removeEventListener('scroll', handleScroll)
      }
    }
    return () => {}
  }, [ref])

  return isScrolling
}
