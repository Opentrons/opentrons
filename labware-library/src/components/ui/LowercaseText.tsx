import * as React from 'react'

import styles from './styles.module.css'

export interface LowercaseTextProps {
  /** text to display in lowercase */
  children: React.ReactNode
}

/**
 * LowercaseText - <span> that transforms all text to lowercase
 */
export function LowercaseText(props: LowercaseTextProps): JSX.Element {
  return <span className={styles.lowercase_text}>{props.children}</span>
}
