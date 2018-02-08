// @flow
import * as React from 'react'

import {Icon, SPINNER} from '@opentrons/components'
import CalibrationInfoContent from '../CalibrationInfoContent'
import styles from './tip-probe.css'

export default function UnprobedPanel () {
  return (
    <CalibrationInfoContent
      leftChildren={(
        <Icon name={SPINNER} spin className={styles.spinner} />
      )}
    />
  )
}
