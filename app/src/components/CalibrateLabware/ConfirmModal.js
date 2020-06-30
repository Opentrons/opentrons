// @flow
// labware calibration controls modal
import * as React from 'react'
import cx from 'classnames'

import { getLabwareDisplayName } from '@opentrons/shared-data'
import { ModalPage } from '@opentrons/components'
import type { Labware } from '../../robot'
import { ConfirmModalContents } from './ConfirmModalContents'
import styles from './styles.css'

export type ConfirmModalProps = {|
  labware: Labware,
  calibrateToBottom: boolean,
  onBackClick: () => mixed,
|}

export function ConfirmModal(props: ConfirmModalProps): React.Node {
  const { labware, onBackClick, calibrateToBottom } = props

  // disable back click if we're moving or if we've loaded up with tips
  const backClickDisabled =
    labware.isMoving || labware.calibration === 'picked-up'

  // TODO (ka 2018-4-18): this is a temporary workaround for a style override
  // for in progress screens with transparent bg
  const contentsStyle = labware.calibration.match(
    /^(moving-to-slot|picking-up|dropping-tip|confirming)$/
  )
    ? cx(styles.modal_contents, styles.in_progress_contents)
    : styles.modal_contents

  const labwareDisplayName = labware.definition
    ? getLabwareDisplayName(labware.definition)
    : labware.name

  const titleBar = {
    title: 'Calibrate Labware',
    // subtitle is capitalized by CSS, and "µL" capitalized is "ML"
    subtitle: labwareDisplayName.replace('µL', 'uL'),
    back: { onClick: onBackClick, disabled: backClickDisabled },
  }

  return (
    <ModalPage
      titleBar={titleBar}
      contentsClassName={contentsStyle}
      heading={
        <span className={styles.wizard_title}>
          Calibrate pipette to {labwareDisplayName}
        </span>
      }
    >
      <ConfirmModalContents
        labware={labware}
        calibrateToBottom={calibrateToBottom}
      />
    </ModalPage>
  )
}
