// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export type CardContentRowProps = {|
  children: React.Node,
  className?: string,
|}

export function CardContentRow(props: CardContentRowProps) {
  return (
    <div className={cx(styles.card_row, props.className)}>{props.children}</div>
  )
}
