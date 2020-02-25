// @flow
import * as React from 'react'
import styles from './styles.css'

export type CardContainerProps = {|
  children: React.Node,
|}

export function CardContainer(props: CardContainerProps) {
  return <div className={styles.card_container}>{props.children}</div>
}
