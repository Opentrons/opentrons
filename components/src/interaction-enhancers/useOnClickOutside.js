// @flow
import { type ElementRef, useEffect, useRef } from 'react'
import assert from 'assert'

type Params = { onClickOutside: ?(any) => mixed }
const useOnClickOutside = (params: Params) => {
  const { onClickOutside } = params
  const node: ElementRef<*> = useRef()

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
        !node.current.contains(clickedElem)
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

export default useOnClickOutside
