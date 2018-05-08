// @flow
import * as React from 'react'
import type {CalibrateDeckStartedProps} from './types'
import {PrimaryButton} from '@opentrons/components'

import styles from './styles.css'
import attachTipSingleSrc from './images/attach-tip-single@3x.png'
import attachTipMultiSrc from './images/attach-tip-multi@3x.png'

type Props = CalibrateDeckStartedProps & {
  proceed: () => mixed
}

export default function AttachTipModal (props: Props) {
  const multi = props.pipette.channels === 8

  const attachTipSrc = multi
    ? attachTipMultiSrc
    : attachTipSingleSrc

  const tipLocation = multi
    ? 'very first channel at front of'
    : ''

  return (
    <div className={styles.attach_tip_contents}>
      <div className={styles.attach_tip_instructions}>
        <p>Place a GEB tip on the {tipLocation} pipette before continuing.</p>
        <p>Confirm tip is attached to start calibration.</p>
        <PrimaryButton
          title='confirm tip attached'
          onClick={props.proceed}
        >
        confirm tip attached
        </PrimaryButton>
      </div>
      <div className={styles.attach_tip_diagram}>
        <img src={attachTipSrc} />
      </div>
    </div>
  )
}
