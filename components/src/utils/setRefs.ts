import type { MutableRefObject, Ref } from 'react'

export const setRefs = <T>(...refs: Array<Ref<T> | undefined>) => {
  return (node: T | null) => {
    refs.forEach(ref => {
      if (ref == null) return
      if (typeof ref === 'function') ref(node)
      else (ref as MutableRefObject<T | null>).current = node
    })
  }
}
