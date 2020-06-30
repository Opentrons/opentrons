// @flow
// pickup confirmation prompt component for ConfirmPickupContents
import * as React from 'react'

import { PrimaryButton } from '@opentrons/components'
import type { Labware, Pipette } from '../../robot/types'
import styles from './styles.css'

export type ConfirmPickupPromptProps = {|
  labware: Labware,
  calibrator: Pipette,
  onNoClick: () => void,
  onYesClick: () => void,
|}

export function ConfirmPickupPrompt(
  props: ConfirmPickupPromptProps
): React.Node {
  const {
    onNoClick,
    onYesClick,
    calibrator: { mount, channels },
  } = props
  const multi = channels === 8
  const maybePluralTip = `${multi ? '' : 'a '}tip${multi ? 's' : ''}`

  return (
    <div className={styles.confirm_pickup}>
      <p className={styles.confirm_pickup_text}>
        Did the {mount} pipette pick up {maybePluralTip} successfully?
      </p>
      <PrimaryButton
        onClick={onNoClick}
        className={styles.confirm_pickup_button}
      >
        No, try again
      </PrimaryButton>
      <PrimaryButton
        onClick={onYesClick}
        className={styles.confirm_pickup_button}
      >
        Yes, save calibration
      </PrimaryButton>
    </div>
  )
}
