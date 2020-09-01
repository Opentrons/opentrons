// @flow
import * as React from 'react'
import { css } from 'styled-components'
import {
  Box,
  Flex,
  SPACING_2,
  SPACING_3,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  ALIGN_FLEX_START,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  POSITION_RELATIVE,
  FONT_HEADER_DARK,
  FONT_BODY_2_DARK,
  TEXT_TRANSFORM_UPPERCASE,
  TEXT_ALIGN_CENTER,
  Link,
  PrimaryBtn,
  Text,
  useConditionalConfirm,
  FONT_SIZE_BODY_2,
  C_MED_GRAY,
} from '@opentrons/components'

import * as Sessions from '../../sessions'
import { labwareImages } from './labwareImages'
import { getLatestLabwareDef } from '../../getLabware'
import { Portal } from '../portal'
import { ConfirmClearDeckModal } from './ConfirmClearDeckModal'
import type { SessionType } from '../../sessions/types'
import type { CalibrationPanelProps } from './types'

const LABWARE_LIBRARY_PAGE_PATH = 'https://labware.opentrons.com'

const DECK_CAL_HEADER = 'deck calibration'
const DECK_CAL_BODY =
  'Deck calibration ensures positional accuracy so that your robot moves as expected. It will accurately establish the OT-2’s deck orientation relative to the gantry.'
const DECK_CAL_PROCEDURE = 'to calibrate deck'

const PIP_OFFSET_CAL_HEADER = 'pipette offset calibration'
const PIP_OFFSET_CAL_BODY =
  'Calibrating pipette offset enables robot to accurately establish the location of the mounted pipette’s nozzle, relative to the deck.'
const PIP_OFFSET_CAL_PROCEDURE = 'to calibrate pipette offset'

const CONTINUE = 'continue'
const LABWARE_REQS = 'For this process you will require:'
const NOTE_HEADER = 'Please note:'
const IT_IS = "It's"
const EXTREMELY = 'extremely'
const NOTE_BODY =
  'important you perform this calibration using the exact tips specified in your protocol, as the robot uses the corresponding labware definition data to find the tip.'
const VIEW_TIPRACK_MEASUREMENTS = 'View measurements'

const contentsBySessionType: {
  [SessionType]: {
    headerText: string,
    bodyText: string,
  },
} = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: {
    headerText: DECK_CAL_HEADER,
    bodyText: DECK_CAL_BODY,
    continueButtonText: `${CONTINUE} ${DECK_CAL_PROCEDURE}`,
    continuingTo: DECK_CAL_PROCEDURE,
  },
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]: {
    headerText: PIP_OFFSET_CAL_HEADER,
    bodyText: PIP_OFFSET_CAL_BODY,
    continueButtonText: CONTINUE,
    continuingTo: PIP_OFFSET_CAL_PROCEDURE,
  },
}

export function Introduction(props: CalibrationPanelProps): React.Node {
  const { tipRack, sendSessionCommand, sessionType } = props

  const { showConfirmation, confirm: proceed, cancel } = useConditionalConfirm(
    () => {
      sendSessionCommand(Sessions.sharedCalCommands.LOAD_LABWARE)
    },
    true
  )

  const { headerText, bodyText, continueButtonText } = contentsBySessionType[
    sessionType
  ]

  return (
    <>
      <Flex
        marginY={SPACING_2}
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_FLEX_START}
        position={POSITION_RELATIVE}
      >
        <Text
          css={FONT_HEADER_DARK}
          marginBottom={SPACING_3}
          textTransform={TEXT_TRANSFORM_UPPERCASE}
        >
          {headerText}
        </Text>
        <Text marginBottom={SPACING_3} css={FONT_BODY_2_DARK}>
          {bodyText}
        </Text>
        <h5>{LABWARE_REQS}</h5>
        <Flex flexDirection={DIRECTION_ROW} marginTop={SPACING_3}>
          <RequiredLabwareCard loadName={tipRack.loadName} />
        </Flex>
        <Box fontSize={FONT_SIZE_BODY_1} marginY={SPACING_3}>
          <Text>
            <b
              css={css`
                text-transform: uppercase;
              `}
            >{`${NOTE_HEADER} `}</b>
            {IT_IS}
            <u>{` ${EXTREMELY} `}</u>
            {NOTE_BODY}
          </Text>
        </Box>
      </Flex>
      <Flex width="100%" justifyContent={JUSTIFY_CENTER}>
        <PrimaryBtn onClick={proceed} flex="1" margin="1.5rem 5rem 1rem">
          {continueButtonText}
        </PrimaryBtn>
      </Flex>
      {showConfirmation && (
        <Portal>
          <ConfirmClearDeckModal
            continuingTo={continuingTo}
            confirm={proceed}
            cancel={cancel}
          />
        </Portal>
      )}
    </>
  )
}

type RequiredLabwareCardProps = {| loadName: string |}

const linkStyles = css`
  cursor: pointer;
  text-decoration: none;

  &:hover {
    background-color: var(--c-bg-hover);
  }
`

function RequiredLabwareCard(props: RequiredLabwareCardProps) {
  const { loadName } = props
  return (
    <Flex
      width="50%"
      border={`1px solid ${C_MED_GRAY}`}
      padding={`0 ${SPACING_3}`}
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
    >
      <Flex
        padding={`${SPACING_3} 0`}
        height="70%"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        <img
          css={css`
            width: 100%;
            max-height: 100%;
          `}
          src={labwareImages[loadName]}
        />
      </Flex>
      <Text fontSize={FONT_SIZE_BODY_2}>
        {getLatestLabwareDef(loadName)?.metadata.displayName}
      </Text>
      <Link
        external
        padding={`${SPACING_3} ${SPACING_2}`}
        flex="0.6"
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        textAlign={TEXT_ALIGN_CENTER}
        fontSize={FONT_SIZE_BODY_2}
        color="inherit"
        css={linkStyles}
        href={`${LABWARE_LIBRARY_PAGE_PATH}/${loadName}`}
      >
        {VIEW_TIPRACK_MEASUREMENTS}
      </Link>
    </Flex>
  )
}
