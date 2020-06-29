// @flow
import { PrimaryButton } from '@opentrons/components'
import * as React from 'react'

import styles from './styles.css'
import type { CalibrateTipLengthChildProps } from './types'

const CONFIRM_TIP_BODY = 'Did pipette pick up tips successfully?'
const CONFIRM_TIP_YES_BUTTON_TEXT = 'Yes, continue'
const CONFIRM_TIP_NO_BUTTON_TEXT = 'No, try again'

export function InspectingTip(props: CalibrateTipLengthChildProps): React.Node {
  const invalidateTip = () => {
    console.log('TODO: wire up command')
    // props.sendSessionCommand('invalidateTip')
  }
  const confirmTip = () => {
    console.log('TODO: wire up command')
    // props.sendSessionCommand('confirmTip')
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
