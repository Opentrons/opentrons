// @flow
// in progress spinner for ConfirmModalContents
import * as React from 'react'

import {Icon, SPINNER} from '@opentrons/components'
import styles from './styles.css'

export default function InProgressContent () {
  return (
    <Icon className={styles.spinner} name={SPINNER} spin />
  )
}
