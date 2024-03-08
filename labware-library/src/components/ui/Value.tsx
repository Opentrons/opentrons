import * as React from 'react'
import styles from './styles.module.css'

export interface ValueProps {
  /** contents of the value */
  children: React.ReactNode
}

/**
 * Value - display a value, sometimes in a <Table> and usually labeled by a
 * <LabelText>
 */
export function Value(props: ValueProps): JSX.Element {
  return <p className={styles.value}>{props.children}</p>
}
