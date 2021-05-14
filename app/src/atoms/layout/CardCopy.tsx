import * as React from 'react'

import styles from './styles.css'

export interface CardCopyProps {
  children: React.ReactNode
}

export function CardCopy(props: CardCopyProps): JSX.Element {
  return <p className={styles.card_copy}>{props.children}</p>
}
