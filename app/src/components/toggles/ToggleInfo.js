// @flow
import * as React from 'react'

import styles from './styles.css'

type Props = {
  children: React.Node
}
export default function ToggleInfo (props: Props) {
  return (
    <div className={styles.toggle_info}>
      {props.children}
    </div>
  )
}
