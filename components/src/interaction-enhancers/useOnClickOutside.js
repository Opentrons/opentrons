// @flow
import { useEffect, useRef } from 'react'
import assert from 'assert'

const useOnClickOutside = ({ onClickOutside }) => {
  const node = useRef()
  const handleClickOutside = (event: MouseEvent) => {
    const clickedElem = event.target

    assert(
      clickedElem instanceof Node,
      'expected clicked element to be Node - something went wrong in onClickOutside hook'
    )

    if (onClickOutside && node && !node.current.contains(clickedElem)) {
      onClickOutside(event)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return node
}

export default useOnClickOutside
