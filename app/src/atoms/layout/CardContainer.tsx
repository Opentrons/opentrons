import * as React from 'react'
import styles from './styles.css'

export interface CardContainerProps {
  children: React.ReactNode
}

export function CardContainer(props: CardContainerProps): JSX.Element {
  return <div className={styles.card_container}>{props.children}</div>
}
