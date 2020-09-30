// @flow
import * as React from 'react'

import styles from './styles.css'

export type ValueProps = {|
  /** contents of the value */
  children: React.Node,
|}

/**
 * Value - display a value, sometimes in a <Table> and usually labeled by a
 * <LabelText>
 */
export function Value(props: ValueProps): React.Node {
  return <p className={styles.value}>{props.children}</p>
}
