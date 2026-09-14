import { useState } from 'react'

import { Icon, SPACING, StyledText } from '@opentrons/components'

import styles from './accordion.module.css'

import type { JSX, ReactNode } from 'react'

export interface AccordionProps {
  id: string
  title: string
  children?: ReactNode
}

export function Accordion({
  id,
  title,
  children,
}: AccordionProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={styles.accordion}>
      <button
        type="button"
        className={styles.header}
        onClick={() => {
          setIsExpanded(current => !current)
        }}
        aria-expanded={isExpanded}
        aria-controls={id}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold" className={styles.title}>
          {title}
        </StyledText>
        <Icon
          name={isExpanded ? 'minus' : 'plus'}
          size={SPACING.spacing24}
          className={styles.icon}
        />
      </button>
      {isExpanded ? (
        <div id={id} className={styles.content}>
          {children}
        </div>
      ) : null}
    </div>
  )
}
