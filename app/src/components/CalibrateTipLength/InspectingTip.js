// @flow
import * as React from 'react'
import { PrimaryButton } from '@opentrons/components'

import * as Sessions from '../../sessions'
import type { CalibrateTipLengthChildProps } from './types'
import styles from './styles.css'

const CONFIRM_TIP_BODY = 'Did pipette pick up tips successfully?'
const CONFIRM_TIP_YES_BUTTON_TEXT = 'Yes, continue'
const CONFIRM_TIP_NO_BUTTON_TEXT = 'No, try again'

export function InspectingTip(props: CalibrateTipLengthChildProps): React.Node {
  const { sendSessionCommand } = props
  const invalidateTip = () => {
    sendSessionCommand(Sessions.tipCalCommands.PICK_UP_TIP)
  }
  const confirmTip = () => {
    sendSessionCommand(Sessions.tipCalCommands.MOVE_TO_REFERENCE_POINT)
  }
  return (
    <div className={styles.tip_pick_up_confirmation_wrapper}>
      <p className={styles.pick_up_tip_confirmation_body}>{CONFIRM_TIP_BODY}</p>
      <PrimaryButton
        className={styles.pick_up_tip_confirmation_button}
        onClick={invalidateTip}
      >
        {CONFIRM_TIP_NO_BUTTON_TEXT}
      </PrimaryButton>
      <PrimaryButton
        className={styles.pick_up_tip_confirmation_button}
        onClick={confirmTip}
      >
        {CONFIRM_TIP_YES_BUTTON_TEXT}
      </PrimaryButton>
    </div>
  )
}
