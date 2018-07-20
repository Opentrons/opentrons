// @flow
import * as React from 'react'

import {Icon, LabwareContainer} from '@opentrons/components'
import styles from './styles.css'

const DIMENSIONS = {
  x: -28.3,
  y: -2.5,
  width: 158.6,
  height: 90.5
}

export default function ModuleItem () {
  return (
    <LabwareContainer {...DIMENSIONS}>
      <rect
        className={styles.module}
        rx='6'
        ry='6'
        width='100%'
        height='100%'
        fill='#000'
      />
      <Icon
        className={styles.module_icon}
        x='8'
        y='20'
        width='16'
        name='usb'
      />
    </LabwareContainer>
  )
}
