// @flow
import * as React from 'react'
import { css } from 'styled-components'
import {
  Text,
  Flex,
  Icon,
  PrimaryBtn,
  COLOR_SUCCESS,
  ALIGN_CENTER,
  ALIGN_STRETCH,
  ALIGN_FLEX_START,
  DIRECTION_COLUMN,
  SPACING_3,
  SPACING_4,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import type { CalibrationPanelProps } from './types'
import type { SessionType } from '../../sessions/types'
import * as Sessions from '../../sessions'

import slotOneRemoveBlockAsset from '../../assets/videos/tip-length-cal/Slot_1_Remove_CalBlock_(330x260)REV1.webm'
import slotThreeRemoveBlockAsset from '../../assets/videos/tip-length-cal/Slot_3_Remove_CalBlock_(330x260)REV1.webm'

const assetBySlot = {
  '1': slotOneRemoveBlockAsset,
  '3': slotThreeRemoveBlockAsset,
}
const DECK_CAL_HEADER = 'Deck Calibration complete'
const PIP_OFFSET_CAL_HEADER = 'Pipette Offset Calibration complete'
const TIP_CAL_HEADER = 'Tip Length Calibration complete'
const REMOVE_BLOCK = 'Remove Calibration Block from the deck.'
const RETURN_TIP = 'Return tip to tip rack and exit'

const contentsBySessionType: { [SessionType]: { headerText: string } } = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: { headerText: DECK_CAL_HEADER },
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]: {
    headerText: PIP_OFFSET_CAL_HEADER,
  },
  [Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION]: {
    headerText: TIP_CAL_HEADER,
  },
}

export function CompleteConfirmation(props: CalibrationPanelProps): React.Node {
  const { sessionType, calBlock } = props
  const { headerText } = contentsBySessionType[sessionType]

  const exitSession = () => {
    props.cleanUpAndExit()
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
      {calBlock && (
        <>
          <Text marginY={SPACING_4}>{REMOVE_BLOCK}</Text>
          <Flex justifyContent={JUSTIFY_CENTER} alignSelf={ALIGN_STRETCH}>
            <video
              key={assetBySlot[calBlock.slot]}
              css={css`
                max-width: 100%;
                max-height: 15rem;
              `}
              autoPlay={true}
              loop={true}
              controls={false}
            >
              <source src={assetBySlot[calBlock.slot]} />
            </video>
          </Flex>
        </>
      )}

      <Flex width="100%" justifyContent={JUSTIFY_CENTER} marginY={SPACING_3}>
        <PrimaryBtn title={RETURN_TIP} flex="1" onClick={exitSession}>
          {RETURN_TIP}
        </PrimaryBtn>
      </Flex>
    </Flex>
  )
}
