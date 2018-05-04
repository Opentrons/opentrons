// @flow
import * as React from 'react'
import type {CalibrateDeckProps} from './types'
import {ModalPage, PrimaryButton} from '@opentrons/components'

import styles from './styles.css'

import attachTipSrc from './images/attach-tip-multi@3x.png'

export default function AttachTipModal (props: CalibrateDeckProps) {
  return (
    <ModalPage
      titleBar={{
        title: props.title,
        subtitle: props.subtitle,
        back: {
          disabled: true
        }
      }}
      heading= 'Place a tip on left pipette'
      >
        <div className={styles.attach_tip_contents}>
          <div className={styles.attach_tip_instructions}>
            <p>Place a GEB  tip on the very first channel at front of pipette before continuing.</p>
            <p>Confirm tip is attached to start calibration.</p>
            <PrimaryButton
              title='confirm tip attached'
              disabled
            >
            confirm tip attached
            </PrimaryButton>
          </div>
          <div className={styles.attach_tip_diagram}>
            <img src={attachTipSrc} />
          </div>
        </div>
      </ ModalPage>
  )
}
