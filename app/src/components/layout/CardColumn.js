// @flow
import * as React from 'react'

import styles from './styles.css'

export type CardColumnProps = {|
  children: React.Node,
|}

export function CardColumn(props: CardColumnProps): React.Node {
  return <div className={styles.column_50}>{props.children}</div>
}
