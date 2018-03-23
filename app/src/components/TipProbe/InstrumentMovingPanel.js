// @flow
import * as React from 'react'

import {Icon} from '@opentrons/components'
import CalibrationInfoContent from '../CalibrationInfoContent'
import styles from './tip-probe.css'

export default function UnprobedPanel () {
  return (
    <CalibrationInfoContent
      leftChildren={(
        <Icon name='ot-spinner' spin className={styles.spinner} />
      )}
    />
  )
}
