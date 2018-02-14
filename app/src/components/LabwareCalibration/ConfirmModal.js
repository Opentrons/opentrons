// @flow
// labware calibration controls modal
import * as React from 'react'

import type {Labware} from '../../robot'

import {TitleBar, Overlay} from '@opentrons/components'
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

  // TODO(mc, 2018-02-07): TitleBar is locked to <h1> and <h2>
  //   this isn't quite semantic, so fix it up
  return (
    <div className={styles.modal}>
      <Overlay />
      <TitleBar
        className={styles.title_bar}
        title='Calibrate Deck'
        subtitle={labware.type}
        onBackClick={onBackClick}
        backClickDisabled={backClickDisabled}
      />
      <div className={styles.modal_contents}>
        <ConfirmModalContents {...labware} />
      </div>
    </div>
  )
}
