// @flow
import * as React from 'react'
import {
  Flex,
  PrimaryBtn,
  Text,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  SPACING_3,
} from '@opentrons/components'

import * as Sessions from '../../sessions'
import type { CalibrationPanelProps } from './types'

const CONFIRM_TIP_BODY = 'Did pipette pick up tip successfully?'
const CONFIRM_TIP_YES_BUTTON_TEXT = 'Yes, move to slot 5'
const CONFIRM_TIP_NO_BUTTON_TEXT = 'No, try again'

export function TipConfirmation(props: CalibrationPanelProps): React.Node {
  const { sendSessionCommand } = props

  const invalidateTip = () => {
    sendSessionCommand({ command: Sessions.sharedCalCommands.INVALIDATE_TIP })
  }
  const confirmTip = () => {
    sendSessionCommand({ command: Sessions.sharedCalCommands.MOVE_TO_DECK })
  }

  return (
    <Flex
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <Text marginBottom={SPACING_3}>{CONFIRM_TIP_BODY}</Text>
      <PrimaryBtn marginTop={SPACING_3} width="80%" onClick={invalidateTip}>
        {CONFIRM_TIP_NO_BUTTON_TEXT}
      </PrimaryBtn>
      <PrimaryBtn marginTop={SPACING_3} width="80%" onClick={confirmTip}>
        {CONFIRM_TIP_YES_BUTTON_TEXT}
      </PrimaryBtn>
    </Flex>
  )
}
