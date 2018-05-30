// @flow
// TODO(mc, 2018-05-30): move to or replace with something from components lib
import * as React from 'react'

import styles from './styles.css'

type Props = {
  children: ?React.Node
}

export default function ModalTitle (props: Props) {
  return (
    <h3 className={styles.modal_title}>
      {props.children}
    </h3>
  )
}
