// @flow
import * as React from 'react'
import {
  Flex,
  Icon,
  PrimaryButton,
  COLOR_SUCCESS,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  DIRECTION_COLUMN,
  SPACING_3,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import type { CalibrationPanelProps } from './types'
import * as Sessions from '../../sessions'

const COMPLETE_HEADER = 'Deck calibration complete'
const RETURN_TIP = 'Return tip to tip rack and exit'

export function CompleteConfirmation(props: CalibrationPanelProps): React.Node {
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
          color={COLOR_SUCCES}
        />
        <h3>{COMPLETE_HEADER}</h3>
      </Flex>

      <PrimaryButton marginY={SPACING_3} onClick={exitSession}>
        {RETURN_TIP}
      </PrimaryButton>
    </Flex>
  )
}
