// @flow
import * as React from 'react'

import { Icon } from '@opentrons/components'
import styles from './styles.css'

export default function LabwareSpinner() {
  return (
    <div className={styles.labware_spinner_wrapper}>
      <Icon className={styles.spinner} name="ot-spinner" spin />
    </div>
  )
}
