// @flow
import assert from 'assert'
import { useEffect, useRef } from 'react'

export type UseOnClickOutsideOptions = $Shape<{|
  onClickOutside?: MouseEvent => mixed,
|}>

export const useOnClickOutside = <E: Element>(
  options: UseOnClickOutsideOptions
): {| current: E | null |} => {
  const { onClickOutside } = options
  const node: {| current: E | null |} = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedElem = event.target

      assert(
        clickedElem instanceof Node,
        'expected clicked element to be Node - something went wrong in onClickOutside hook'
      )

      if (
        onClickOutside &&
        node &&
        node.current &&
        node.current.contains &&
        !node.current.contains(((clickedElem: any): Node))
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
