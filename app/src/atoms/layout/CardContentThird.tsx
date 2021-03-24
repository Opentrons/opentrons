import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export interface CardContentThirdProps {
  children: React.ReactNode
  className?: string
}

export function CardContentThird(props: CardContentThirdProps): JSX.Element {
  return (
    <div className={cx(styles.card_content_third, props.className)}>
      {props.children}
    </div>
  )
}
