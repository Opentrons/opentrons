import { useId, useState } from 'react'

import { Icon, StyledText } from '@opentrons/components'

import styles from './accordion.module.css'

import type { JSX, ReactNode } from 'react'

export interface AccordionProps {
  title: string
  children?: ReactNode
}

export function Accordion({ title, children }: AccordionProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const contentId = useId()

  return (
    <div className={styles.accordion}>
      <button
        type="button"
        className={styles.header}
        onClick={() => {
          setIsExpanded(current => !current)
        }}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold" className={styles.title}>
          {title}
        </StyledText>
        <Icon
          name={isExpanded ? 'minus' : 'plus'}
          size="24px"
          className={styles.icon}
        />
      </button>
      {isExpanded ? (
        <div id={contentId} className={styles.content}>
          {children}
        </div>
      ) : null}
    </div>
  )
}
