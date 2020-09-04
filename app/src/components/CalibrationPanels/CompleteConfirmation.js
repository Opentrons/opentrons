// @flow
import * as React from 'react'
import {
  Flex,
  Icon,
  PrimaryBtn,
  COLOR_SUCCESS,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  DIRECTION_COLUMN,
  SPACING_3,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import type { CalibrationPanelProps } from './types'
import type { SessionType } from '../../sessions/types'
import * as Sessions from '../../sessions'

const DECK_CAL_HEADER = 'Deck calibration complete'
const PIP_OFFSET_CAL_HEADER = 'Pipette offset calibration complete'
const RETURN_TIP = 'Return tip to tip rack and exit'

const contentsBySessionType: { [SessionType]: { headerText: string } } = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: { headerText: DECK_CAL_HEADER },
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]: {
    headerText: PIP_OFFSET_CAL_HEADER,
  },
}

export function CompleteConfirmation(props: CalibrationPanelProps): React.Node {
  const { sessionType } = props
  const { headerText } = contentsBySessionType[sessionType]

  // TODO: BC 2020-09-04 avoid potential race condition by having an epic send the delete
  // session command upon a successful exit response
  const exitSession = () => {
    props.sendSessionCommand(Sessions.sharedCalCommands.EXIT)
    props.deleteSession()
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING_3}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_FLEX_START}
      width="100%"
      flex={1}
    >
      <Flex alignItems={ALIGN_CENTER} marginTop={SPACING_3}>
        <Icon
          name="check-circle"
          width="2.5rem"
          marginRight={SPACING_3}
          color={COLOR_SUCCESS}
        />
        <h3>{headerText}</h3>
      </Flex>

      <PrimaryBtn title={RETURN_TIP} marginY={SPACING_3} onClick={exitSession}>
        {RETURN_TIP}
      </PrimaryBtn>
    </Flex>
  )
}
