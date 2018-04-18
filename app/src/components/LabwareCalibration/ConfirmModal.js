// @flow
// labware calibration controls modal
import * as React from 'react'

import type {Labware} from '../../robot'

import {ModalPage} from '@opentrons/components'
import ConfirmModalContents from './ConfirmModalContents'
import styles from './styles.css'

type Props = {
  labware: Labware,
  onBackClick: () => void
}

export default function ConfirmModal (props: Props) {
  const {labware, onBackClick} = props

  // disable back click if we're moving or if we've loaded up with tips
  const backClickDisabled = (
    labware.isMoving ||
    labware.calibration === 'picked-up'
  )

  const titleBar = {
    title: 'Calibrate Deck',
    subtitle: labware.type,
    back: {onClick: onBackClick, disabled: backClickDisabled}
  }

  return (
    <ModalPage
      titleBar={titleBar}
      contentsClassName={styles.modal_contents}
    >
      <ConfirmModalContents {...labware} />
    </ModalPage>
  )
}
