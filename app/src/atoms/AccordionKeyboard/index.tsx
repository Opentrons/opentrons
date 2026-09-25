import { useCallback, useEffect } from 'react'
import clsx from 'clsx'

import { Icon } from '@opentrons/components'

import styles from './accordionkeyboard.module.css'

import type { ReactNode, RefObject } from 'react'

interface AccordionKeyboardProps {
  children: ReactNode
  isOpen: boolean
  onToggle: () => void
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>
}
export function AccordionKeyboard({
  children,
  isOpen,
  onToggle,
  inputRef,
}: AccordionKeyboardProps): JSX.Element {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'WakeUp' || event.target !== inputRef.current) {
        return
      }
      if (isOpen || event.key === 'Escape') {
        onToggle()
      }
    },
    [isOpen, onToggle, inputRef]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  return (
    <div
      className={clsx(
        styles.accordion_container,
        isOpen && styles.accordion_container_open
      )}
    >
      <div className={styles.accordion_header}>
        <button
          type="button"
          onClick={onToggle}
          className={styles.chevron_button}
          aria-expanded={isOpen}
          aria-label={
            isOpen ? 'Hide software keyboard' : 'Show software keyboard'
          }
        >
          <Icon name={isOpen ? 'chevron-down' : 'chevron-up'} size="2.75rem" />
        </button>
      </div>
      <div
        className={clsx(
          styles.accordion_body,
          !isOpen && styles.accordion_body_closed
        )}
        data-testid="AccordionKeyboard_body"
      >
        {children}
      </div>
    </div>
  )
}
