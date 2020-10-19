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
import type { CalibrationPanelProps } from '../CalibrationPanels/types'

const CONFIRM_RETURN_BODY = 'Return tip and '
const CONTINUE_TO_NEXT = 'continue to next pipette'
const EXIT_PROGRAM = 'see calibration health check results'
const CONTINUE = 'continue to the next tiprack'
const EXIT = 'continue to the result summary'

export function ReturnTip(props: CalibrationPanelProps): React.Node {
  const { sendCommands, checkBothPipettes, activePipette } = props
  const onFinalPipette =
    !checkBothPipettes ||
    activePipette?.rank === Sessions.CHECK_PIPETTE_RANK_SECOND
  let commandsList
  if (!onFinalPipette) {
    commandsList = [
      { command: Sessions.checkCommands.RETURN_TIP },
      { command: Sessions.checkCommands.CHECK_SWITCH_PIPETTE },
    ]
  } else {
    commandsList = [
      { command: Sessions.checkCommands.RETURN_TIP },
      { command: Sessions.checkCommands.TRANSITION },
    ]
  }

  const confirmReturnTip = () => {
    sendCommands(...commandsList)
  }
  return (
    <Flex
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <Text marginBottom={SPACING_3}>
        {`${CONFIRM_RETURN_BODY}
        ${!onFinalPipette ? CONTINUE_TO_NEXT : EXIT_PROGRAM}`}
      </Text>
      <PrimaryBtn
        title="confirmReturnTip"
        marginTop={SPACING_3}
        width="80%"
        onClick={confirmReturnTip}
      >
        {!onFinalPipette ? CONTINUE : EXIT}
      </PrimaryBtn>
    </Flex>
  )
}
