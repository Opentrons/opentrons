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

import * as Sessions from '../../redux/sessions'
import type {
  SessionType,
  SessionCommandString,
} from '../../redux/sessions/types'
import type { CalibrationPanelProps } from './types'

const CONFIRM_TIP_BODY = 'Did pipette pick up tip successfully?'
const YES_AND_MOVE_TO_DECK = 'Yes, move to slot 5'
const YES_AND_MOVE_TO_MEASURE_TIP = 'Yes, move to measure tip length'
const YES_AND_MOVE_TO_CHECK_TIP = 'Yes, move to check tip length'
const NO_TRY_AGAIN = 'No, try again'

const contentsBySessionType: {
  [sessionType in SessionType]: {
    yesButtonText: string
    moveCommandString: SessionCommandString
  }
} = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: {
    yesButtonText: YES_AND_MOVE_TO_DECK,
    moveCommandString: Sessions.sharedCalCommands.MOVE_TO_DECK,
  },
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]: {
    yesButtonText: YES_AND_MOVE_TO_DECK,
    moveCommandString: Sessions.sharedCalCommands.MOVE_TO_DECK,
  },
  [Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION]: {
    yesButtonText: YES_AND_MOVE_TO_MEASURE_TIP,
    moveCommandString: Sessions.sharedCalCommands.MOVE_TO_REFERENCE_POINT,
  },
  [Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK]: {
    yesButtonText: YES_AND_MOVE_TO_CHECK_TIP,
    moveCommandString: Sessions.sharedCalCommands.MOVE_TO_REFERENCE_POINT,
  },
}
export function TipConfirmation(props: CalibrationPanelProps): JSX.Element {
  const { sendCommands, sessionType, shouldPerformTipLength } = props

  const isExtendedPipOffset =
    sessionType === Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION &&
    shouldPerformTipLength

  const lookupType = isExtendedPipOffset
    ? Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION
    : sessionType

  const { yesButtonText, moveCommandString } = contentsBySessionType[lookupType]

  const invalidateTip = (): void => {
    sendCommands({ command: Sessions.sharedCalCommands.INVALIDATE_TIP })
  }
  const confirmTip = (): void => {
    sendCommands({ command: moveCommandString })
  }

  return (
    <Flex
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <Text marginBottom={SPACING_3}>{CONFIRM_TIP_BODY}</Text>
      <PrimaryBtn
        title="invalidateTipButton"
        marginTop={SPACING_3}
        width="80%"
        onClick={invalidateTip}
      >
        {NO_TRY_AGAIN}
      </PrimaryBtn>
      <PrimaryBtn
        title="confirmTipAttachedButton"
        marginTop={SPACING_3}
        width="80%"
        onClick={confirmTip}
      >
        {yesButtonText}
      </PrimaryBtn>
    </Flex>
  )
}
