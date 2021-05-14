import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export interface CardContentFlexProps {
  children: React.ReactNode
  className?: string
}

export function CardContentFlex(props: CardContentFlexProps): JSX.Element {
  return (
    <div className={cx(styles.card_content_flex, props.className)}>
      {props.children}
    </div>
  )
}
