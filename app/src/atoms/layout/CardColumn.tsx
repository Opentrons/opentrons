import * as React from 'react'
import styles from './styles.css'

export interface CardColumnProps {
  children: React.ReactNode
}

export function CardColumn(props: CardColumnProps): React.ReactNode {
  return <div className={styles.column_50}>{props.children}</div>
}
