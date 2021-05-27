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
import * as Sessions from '../../redux/sessions'

import slotOneRemoveBlockAsset from '../../assets/videos/tip-length-cal/Slot_1_Remove_CalBlock_(330x260)REV1.webm'
import slotThreeRemoveBlockAsset from '../../assets/videos/tip-length-cal/Slot_3_Remove_CalBlock_(330x260)REV1.webm'
import { NeedHelpLink } from './NeedHelpLink'

import type { CalibrationPanelProps } from './types'
import type {
  SessionType,
  CalibrationLabware,
} from '../../redux/sessions/types'

const assetBySlot: { [slot in CalibrationLabware['slot']]: string } = {
  '1': slotOneRemoveBlockAsset,
  '3': slotThreeRemoveBlockAsset,
}
const DECK_CAL_HEADER = 'Deck Calibration complete'
const PIP_OFFSET_CAL_HEADER = 'Pipette Offset Calibration complete'
const TIP_CAL_HEADER = 'Tip Length Calibration complete'
const REMOVE_BLOCK = 'Remove Calibration Block from the deck.'
const RETURN_TIP = 'Return tip to tip rack and exit'
const PROCEED_TO_DECK = 'Continue to slot 5'
const EXIT = 'exit'
const PROCEED_TO_PIP_OFFSET = 'continue to Pipette Offset Calibration'

const contentsBySessionType: Partial<
  Record<SessionType, { headerText: string }>
> = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: { headerText: DECK_CAL_HEADER },
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]: {
    headerText: PIP_OFFSET_CAL_HEADER,
  },
  [Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION]: {
    headerText: TIP_CAL_HEADER,
  },
}

export function CompleteConfirmation(
  props: CalibrationPanelProps
): JSX.Element {
  const {
    sessionType,
    calBlock,
    shouldPerformTipLength,
    cleanUpAndExit,
    sendCommands,
  } = props

  const isExtendedPipOffset =
    sessionType === Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION &&
    shouldPerformTipLength

  const lookupType: SessionType = isExtendedPipOffset
    ? Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION
    : sessionType
  // @ts-expect-error(sa, 2021-05-27): avoiding src code change, use in operator to type narrow
  const { headerText } = contentsBySessionType[lookupType]

  const proceed = (): void => {
    sendCommands(
      {
        command: Sessions.sharedCalCommands.SET_CALIBRATION_BLOCK,
        data: { hasBlock: false },
      },
      { command: Sessions.sharedCalCommands.MOVE_TO_DECK }
    )
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
      <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Flex alignItems={ALIGN_CENTER} marginTop={SPACING_3}>
          <Icon
            name="check-circle"
            width="2.5rem"
            marginRight={SPACING_3}
            color={COLOR_SUCCESS}
          />
          <h3>{headerText}</h3>
        </Flex>
        <NeedHelpLink maxHeight="1rem" />
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

      <Flex
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        marginY={SPACING_3}
      >
        {isExtendedPipOffset && (
          <PrimaryBtn
            title={PROCEED_TO_DECK}
            flex="1"
            marginY={SPACING_3}
            onClick={proceed}
          >
            {PROCEED_TO_PIP_OFFSET}
          </PrimaryBtn>
        )}
        {!isExtendedPipOffset && (
          <PrimaryBtn title={RETURN_TIP} flex="1" onClick={cleanUpAndExit}>
            {shouldPerformTipLength ? EXIT : RETURN_TIP}
          </PrimaryBtn>
        )}
      </Flex>
    </Flex>
  )
}
