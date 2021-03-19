// @flow
import * as React from 'react'
import styles from './styles.css'

export interface CardContainerProps {
  children: React.Node
}

export function CardContainer(props: CardContainerProps): React.Node {
  return <div className={styles.card_container}>{props.children}</div>
}
