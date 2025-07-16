import { useEffect, useRef, useState } from 'react'

import type { RefObject } from 'react'

export function useScrollPosition(): {
  scrollRef: RefObject<HTMLDivElement>
  isScrolled: boolean
} {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState<boolean>(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsScrolled(!entry.isIntersecting)
    })

    if (scrollRef.current != null) {
      observer.observe(scrollRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return { scrollRef, isScrolled }
}
