import { Icon } from '@opentrons/components'

import styles from './accordionkeyboard.module.css'

import type { ReactNode } from 'react'

interface AccordionKeyboardProps {
  children: ReactNode
  isOpen: boolean
  onToggle: () => void
}
export function AccordionKeyboard({
  children,
  isOpen,
  onToggle,
}: AccordionKeyboardProps): ReactNode {
  return (
    <div className={styles.accordion_container}>
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
      {isOpen ? <div className={styles.accordion_body}>{children}</div> : null}
    </div>
  )
}
