// @flow
import * as React from 'react'
import {
  Flex,
  PrimaryButton,
  Text,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  SPACING_3,
} from '@opentrons/components'

import * as Sessions from '../../sessions'
import type { CalibrateDeckChildProps } from './types'
import styles from './styles.css'

const CONFIRM_TIP_BODY = 'Did pipette pick up tip successfully?'
const CONFIRM_TIP_YES_BUTTON_TEXT = 'Yes, continue'
const CONFIRM_TIP_NO_BUTTON_TEXT = 'No, try again'

export function TipConfirmation(props: CalibrateDeckChildProps): React.Node {
  const { sendSessionCommand } = props

  const invalidateTip = () => {
    sendSessionCommand(Sessions.deckCalCommands.INVALIDATE_TIP)
  }
  const confirmTip = () => {
    sendSessionCommand(Sessions.deckCalCommands.MOVE_TO_DECK)
  }

  return (
    <Flex
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <Text marginBottom={SPACING_3}>{CONFIRM_TIP_BODY}</Text>
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
    </Flex>
  )
}
