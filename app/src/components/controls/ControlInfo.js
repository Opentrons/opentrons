// @flow
import * as React from 'react'

import styles from './styles.css'

type Props = {
  children: React.Node,
}
export default function ControlInfo (props: Props) {
  return (
    <div className={styles.control_info}>
      {props.children}
    </div>
  )
}
