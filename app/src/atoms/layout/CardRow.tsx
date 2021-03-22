import * as React from 'react'
import styles from './styles.css'

export interface CardRowProps {
  children: React.Node
}

export function CardRow(props: CardRowProps): React.Node {
  return <div className={styles.row}>{props.children}</div>
}
