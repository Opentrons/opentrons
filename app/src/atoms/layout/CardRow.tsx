import * as React from 'react'
import styles from './styles.css'

export interface CardRowProps {
  children: React.ReactNode
}

export function CardRow(props: CardRowProps): JSX.Element {
  return <div className={styles.row}>{props.children}</div>
}
