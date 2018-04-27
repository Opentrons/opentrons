// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

import type {PipetteConfig} from '@opentrons/labware-definitions'
import {AlertModal} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  actualPipette?: ?PipetteConfig,
  onContinueClick?: () => mixed,
  parentUrl: string,
  cancelText: string,
  continueText: string
}
const HEADING = 'Before continuing, remove from deck:'

export default function ClearDeckAlertModal (props: Props) {
  const {actualPipette, onContinueClick, parentUrl, cancelText, continueText} = props

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        {children: `${cancelText}`, Component: Link, to: parentUrl},
        {
          children: `${continueText}`,
          className: styles.alert_button,
          onClick: onContinueClick
        }
      ]}
    >
      <ul className={styles.alert_list}>
        <li>All tipracks</li>
        <li>All labware</li>
      </ul>
      {actualPipette && (
        <div>
          <p className={styles.alert_note_heading}>
            Note:
          </p>
          <p className={styles.alert_note}>
            Detaching a pipette will also clear its related calibration data
          </p>
        </div>
      )}
    </AlertModal>
  )
}
