// @flow
import * as React from 'react'

import styles from './styles.css'

export type ControlInfoProps = {|
  children: React.Node,
|}

export function ControlInfo(props: ControlInfoProps): React.Node {
  return <div className={styles.control_info}>{props.children}</div>
}
