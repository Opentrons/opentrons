import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export interface CardContentRowProps {
  children: React.ReactNode
  className?: string
}

export function CardContentRow(props: CardContentRowProps): JSX.Element {
  return (
    <div className={cx(styles.card_row, props.className)}>{props.children}</div>
  )
}
