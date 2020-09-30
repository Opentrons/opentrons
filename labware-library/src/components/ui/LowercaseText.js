// @flow
import * as React from 'react'

import styles from './styles.css'

export type LowercaseTextProps = {|
  /** text to display in lowercase */
  children: React.Node,
|}

/**
 * LowercaseText - <span> that transforms all text to lowercase
 */
export function LowercaseText(props: LowercaseTextProps): React.Node {
  return <span className={styles.lowercase_text}>{props.children}</span>
}
