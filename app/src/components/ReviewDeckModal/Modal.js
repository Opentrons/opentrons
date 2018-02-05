// @flow
// modal component for ReviewDeckModal of labware calibration page
import * as React from 'react'

import {Overlay} from '@opentrons/components'

import styles from './styles.css'

type Props = {
  children: React.Node
}

export default function Modal (props: Props) {
  return (
    <div className={styles.modal}>
      <Overlay />
      {props.children}
    </div>
  )
}
