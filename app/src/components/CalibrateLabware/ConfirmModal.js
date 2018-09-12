// @flow
// labware calibration controls modal
import * as React from 'react'
import cx from 'classnames'

import type {Labware} from '../../robot'

import {ModalPage} from '@opentrons/components'
import ConfirmModalContents from './ConfirmModalContents'
import styles from './styles.css'

type Props = {
  labware: Labware,
  calibrateToBottom: boolean,
  onBackClick: () => mixed,
}

export default function ConfirmModal (props: Props) {
  const {labware, onBackClick, calibrateToBottom} = props

  // disable back click if we're moving or if we've loaded up with tips
  const backClickDisabled = (
    labware.isMoving ||
    labware.calibration === 'picked-up'
  )

  // TODO (ka 2018-4-18): this is a temporary workaround for a stlye over ride for in progress screens with transparate bg
  const contentsStyle = labware.calibration.match(/^(moving-to-slot|picking-up|dropping-tip|confirming)$/)
    ? cx(styles.modal_contents, styles.in_progress_contents)
    : styles.modal_contents

  const titleBar = {
    title: 'Calibrate Deck',
    subtitle: labware.type,
    back: {onClick: onBackClick, disabled: backClickDisabled},
  }

  return (
    <ModalPage
      titleBar={titleBar}
      contentsClassName={contentsStyle}
      heading={`Calibrate pipette to ${labware.type}`}
    >
      <ConfirmModalContents {...labware} calibrateToBottom={calibrateToBottom} />
    </ModalPage>
  )
}
