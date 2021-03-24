import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export interface CardContentHalfProps {
  children: React.ReactNode
  className?: string
}

export function CardContentHalf(props: CardContentHalfProps): React.ReactNode {
  return (
    <div className={cx(styles.card_content_50, props.className)}>
      {props.children}
    </div>
  )
}
