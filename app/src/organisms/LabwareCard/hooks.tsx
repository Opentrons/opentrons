import * as React from 'react'

/**
 * Hook that closes a component when a click occurs outside of it.
 *
 * @param {React.RefObject<HTMLInputElement>} ref - The ref of the component to check clicks against.
 * @param {() => void} onClose - The function to call when a click occurs outside the component.
 * @returns {void}
 */
export function useCloseOnOutsideClick(
  ref: React.RefObject<HTMLInputElement>,
  onClose: () => void
): void {
  const handleClick = (e: MouseEvent): void => {
    // @ts-expect-error node and event target types are mismatched
    if (ref.current != null && !ref.current.contains(e.target)) {
      onClose()
    }
  }

  React.useEffect(() => {
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  })
}
