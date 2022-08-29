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
import uniq from 'lodash/uniq'

import * as Sessions from '../../redux/sessions'
import type { CalibrationPanelProps } from '../../organisms/CalibrationPanels/types'
import type { SessionCommandString } from '../../redux/sessions/types'

const CONFIRM_RETURN_BODY = 'Return tip and '
const CONTINUE_TO_NEXT = 'continue to next pipette'
const EXIT_PROGRAM = 'see calibration health check results'
const CONTINUE = 'continue to the next tiprack'
const EXIT = 'continue to the result summary'

export function ReturnTip(props: CalibrationPanelProps): JSX.Element {
  const { sendCommands, checkBothPipettes, activePipette, instruments } = props
  const onFinalPipette =
    !checkBothPipettes ||
    activePipette?.rank === Sessions.CHECK_PIPETTE_RANK_SECOND
  let commandsList: Array<{ command: SessionCommandString }> = [
    { command: Sessions.checkCommands.RETURN_TIP },
  ]
  if (onFinalPipette) {
    commandsList = [
      ...commandsList,
      { command: Sessions.checkCommands.TRANSITION },
    ]
  } else {
    commandsList = [
      ...commandsList,
      { command: Sessions.checkCommands.CHECK_SWITCH_PIPETTE },
    ]
    if (
      instruments &&
      uniq(instruments.map(i => i.tipRackLoadName)).length === 1
    ) {
      // if second pipette has same tip rack as first skip deck setup
      commandsList = [
        ...commandsList,
        { command: Sessions.checkCommands.MOVE_TO_REFERENCE_POINT },
      ]
    }
  }

  const confirmReturnTip = (): void => {
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
        ${onFinalPipette ? EXIT_PROGRAM : CONTINUE_TO_NEXT}`}
      </Text>
      <PrimaryBtn
        title="confirmReturnTip"
        marginTop={SPACING_3}
        width="80%"
        onClick={confirmReturnTip}
      >
        {onFinalPipette ? EXIT : CONTINUE}
      </PrimaryBtn>
    </Flex>
  )
}
