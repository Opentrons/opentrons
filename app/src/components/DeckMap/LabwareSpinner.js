// @flow
import * as React from 'react'

import {Icon} from '@opentrons/components'
import styles from './styles.css'

export default function LabwareSpinner () {
  return (
    <React.Fragment>
      <rect
        x='0' y='0' width='100%' height='100%'
        fill='rgba(0, 0, 0, 0.5)'
      />
      <Icon
        x='10%' y='10%' width='80%' height='80%'
        className={styles.spinner}
        name='ot-spinner'
        spin
      />
    </React.Fragment>
  )
}
