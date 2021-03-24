import * as React from 'react'

import styles from './styles.css'

export interface CardCopyProps {
  children: React.ReactNode
}

export function CardCopy(props: CardCopyProps): React.ReactNode {
  return <p className={styles.card_copy}>{props.children}</p>
}
