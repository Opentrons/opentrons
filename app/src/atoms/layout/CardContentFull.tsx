import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export interface CardContentFullProps {
  children: React.ReactNode
  className?: string
}

export function CardContentFull(props: CardContentFullProps): JSX.Element {
  return (
    <div className={cx(styles.card_content_full, props.className)}>
      {props.children}
    </div>
  )
}
