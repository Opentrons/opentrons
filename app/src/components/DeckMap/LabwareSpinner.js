// @flow
import * as React from 'react'

import { Icon } from '@opentrons/components'
import styles from './styles.css'

export default function LabwareSpinner() {
  return (
    <div className={styles.labware_spinner}>
      <Icon
        x="10%"
        y="10%"
        width="80%"
        height="80%"
        className={styles.spinner}
        name="ot-spinner"
        spin
      />
    </div>
  )
}
