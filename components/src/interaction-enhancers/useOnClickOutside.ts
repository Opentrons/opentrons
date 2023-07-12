import { useEffect, useRef } from 'react'
import assert from 'assert'

import type { RefObject } from 'react'

export interface UseOnClickOutsideOptions {
  onClickOutside?: (e: MouseEvent) => unknown
}

export const useOnClickOutside = <E extends Element>(
  options: UseOnClickOutsideOptions
): RefObject<E> => {
  const { onClickOutside } = options
  const node = useRef<E>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const clickedElem = event.target

      assert(
        clickedElem instanceof Node,
        'expected clicked element to be Node - something went wrong in onClickOutside hook'
      )

      if (
        onClickOutside != null &&
        node != null &&
        node.current != null &&
        node.current.contains != null &&
        !node.current.contains(clickedElem as Node)
      ) {
        onClickOutside(event)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClickOutside])

  return node
}
