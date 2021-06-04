import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export interface CardContentQuarterProps {
  children: React.ReactNode
  className?: string
}

export function CardContentQuarter(
  props: CardContentQuarterProps
): JSX.Element {
  return (
    <div className={cx(styles.card_content_25, props.className)}>
      {props.children}
    </div>
  )
}
