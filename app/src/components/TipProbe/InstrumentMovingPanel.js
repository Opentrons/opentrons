// @flow
import * as React from 'react'

import { Icon } from '@opentrons/components'
import CalibrationInfoContent from '../CalibrationInfoContent'
import styles from './tip-probe.css'

import type { TipProbeProps } from './types'

export default function UnprobedPanel(props: TipProbeProps) {
  return (
    <CalibrationInfoContent
      leftChildren={<Icon name="ot-spinner" spin className={styles.spinner} />}
    />
  )
}
