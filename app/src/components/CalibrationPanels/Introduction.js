// @flow
import * as React from 'react'
import { css } from 'styled-components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import {
  Box,
  Flex,
  DISPLAY_INLINE,
  SPACING_2,
  SPACING_3,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  JUSTIFY_CENTER,
  FONT_WEIGHT_SEMIBOLD,
  POSITION_RELATIVE,
  FONT_HEADER_DARK,
  TEXT_TRANSFORM_UPPERCASE,
  TEXT_ALIGN_CENTER,
  Link,
  PrimaryBtn,
  Text,
  FONT_SIZE_BODY_1,
  FONT_SIZE_BODY_2,
  BORDER_SOLID_MEDIUM,
  C_NEAR_WHITE,
} from '@opentrons/components'

import * as Sessions from '../../sessions'
import { labwareImages } from './labwareImages'
import type { SessionType } from '../../sessions/types'
import type { CalibrationPanelProps, Intent } from './types'
import {
  INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
  INTENT_TIP_LENGTH_IN_PROTOCOL,
  INTENT_PIPETTE_OFFSET,
} from './constants'

const LABWARE_LIBRARY_PAGE_PATH = 'https://labware.opentrons.com'

const DECK_CAL_HEADER = 'deck calibration'
const DECK_CAL_EXPLANATION =
  'Deck calibration ensures positional accuracy so that your robot moves as expected. It will accurately establish the OT-2’s deck orientation relative to the gantry.'

const HEALTH_CHECK_HEADER = 'calibration health check'
const HEALTH_CHECK_INTRO_FRAGMENT =
  'Calibration Health Check diagnoses calibration problems with tip length, pipette offset and the robot deck.'
const HEALTH_CHECK_EXPLANATION_FRAGMENT =
  "During this process, you will manually guide each attached pipette to designated positions on the robot's deck. We will compare these measurements to your saved calibration data."
const HEALTH_CHECK_PROMPT_FRAGMENT =
  'If the check data and stored data is outside of the acceptable threshold, you will be prompted to recalibrate tip length(s), pipette offset(s) or the robot deck.'

const PIP_OFFSET_CAL_HEADER = 'pipette offset calibration'
const PIP_OFFSET_CAL_NAME_FRAGMENT = 'pipette offset'
const PIP_OFFSET_CAL_INTRO_FRAGMENT = 'Calibrating'
const PIP_OFFSET_CAL_EXPLANATION_FRAGMENT =
  'enables the robot to accurately establish the location of the mounted pipette’s nozzle, relative to the deck.'
const PIP_OFFSET_REQUIRES_TIP_LENGTH =
  'You don’t have a tip length saved with this pipette yet. You will need to calibrate tip length before calibrating you pipette offset.'

const TIP_LENGTH_CAL_HEADER = 'tip length calibration'
const TIP_LENGTH_CAL_NAME_FRAGMENT = 'Tip length'
const TIP_LENGTH_CAL_EXPLANATION_FRAGMENT =
  "calibration measures the length of the pipette's tip separately from the pipette's nozzle."
const TIP_LENGTH_INVALIDATES_PIPETTE_OFFSET =
  'This tip was used to calibrate this pipette’s offset. Recalibrating this tip’s length will invalidate this pipette’s offset. If you recalibrate this tip length, you will need to recalibrate this pipette offset afterwards.'

const START = 'start'
const PIP_AND_TIP_CAL_HEADER = 'tip length and pipette offset calibration'
const LABWARE_REQS = 'For this process you will require:'
const NOTE_HEADER = 'Please note:'
const IT_IS = "It's"
const EXTREMELY = 'extremely'
const NOTE_BODY_OUTSIDE_PROTOCOL =
  'important you perform this calibration using the Opentrons tips and tip racks specified above, as the robot determines accuracy based on the measurements of these tips.'
const NOTE_BODY_PRE_PROTOCOL =
  'important you perform this calibration using the exact tips specified in your protocol, as the robot uses the corresponding labware definition data to find the tip.'
const NOTE_HEALTH_CHECK_OUTCOMES =
  'This is the tip rack you used to calibrate your pipette offset. You need to use the same tip rack to check the calibration.'
const VIEW_TIPRACK_MEASUREMENTS = 'View measurements'

type BodySpec = {|
  preFragment: string | null,
  boldFragment: string | null,
  postFragment: string | null,
|}

type PanelContents = {|
  headerText: string,
  invalidationText: string | null,
  bodyContentFragments: Array<BodySpec>,
  outcomeText: string | null,
  continueButtonText: string,
  noteBody: BodySpec,
|}

const bodyContentFromFragments: (
  Array<BodySpec>
) => React.Node = contentFragments => {
  return (
    <>
      {contentFragments
        .map((fragments, index) => (
          <React.Fragment key={index}>
            {fragments.preFragment && (
              <Text display={DISPLAY_INLINE}>
                {`${fragments.preFragment} `}
              </Text>
            )}
            {fragments.boldFragment && (
              <Text display={DISPLAY_INLINE} fontWeight={FONT_WEIGHT_SEMIBOLD}>
                {`${fragments.boldFragment} `}
              </Text>
            )}
            {fragments.postFragment && (
              <Text display={DISPLAY_INLINE}>{fragments.postFragment}</Text>
            )}
          </React.Fragment>
        ))
        .reduce((prev, current) => [prev, ' ', current])}
    </>
  )
}

const contentsByParams: (SessionType, ?boolean, ?Intent) => PanelContents = (
  sessionType,
  isExtendedPipOffset,
  intent
) => {
  switch (sessionType) {
    case Sessions.SESSION_TYPE_DECK_CALIBRATION:
      return {
        headerText: DECK_CAL_HEADER,
        invalidationText: null,
        bodyContentFragments: [
          {
            preFragment: null,
            boldFragment: null,
            postFragment: DECK_CAL_EXPLANATION,
          },
        ],
        outcomeText: null,
        continueButtonText: `${START} ${DECK_CAL_HEADER}`,
        noteBody: {
          preFragment: IT_IS,
          boldFragment: EXTREMELY,
          postFragment: NOTE_BODY_OUTSIDE_PROTOCOL,
        },
      }
    case Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION:
      return {
        headerText: TIP_LENGTH_CAL_HEADER,
        invalidationText: null,
        bodyContentFragments: [
          {
            preFragment: null,
            boldFragment: TIP_LENGTH_CAL_NAME_FRAGMENT,
            postFragment: TIP_LENGTH_CAL_EXPLANATION_FRAGMENT,
          },
        ],
        outcomeText: null,
        continueButtonText: `${START} ${TIP_LENGTH_CAL_HEADER}`,
        noteBody: {
          preFragment: IT_IS,
          boldFragment: EXTREMELY,
          postFragment:
            intent === INTENT_TIP_LENGTH_IN_PROTOCOL
              ? NOTE_BODY_PRE_PROTOCOL
              : NOTE_BODY_OUTSIDE_PROTOCOL,
        },
      }
    case Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION:
      if (isExtendedPipOffset) {
        switch (intent) {
          case INTENT_TIP_LENGTH_IN_PROTOCOL:
            return {
              headerText: PIP_AND_TIP_CAL_HEADER,
              invalidationText: TIP_LENGTH_INVALIDATES_PIPETTE_OFFSET,
              bodyContentFragments: [
                {
                  preFragment: null,
                  boldFragment: TIP_LENGTH_CAL_NAME_FRAGMENT,
                  postFragment: TIP_LENGTH_CAL_EXPLANATION_FRAGMENT,
                },
                {
                  preFragment: PIP_OFFSET_CAL_INTRO_FRAGMENT,
                  boldFragment: PIP_OFFSET_CAL_NAME_FRAGMENT,
                  postFragment: PIP_OFFSET_CAL_EXPLANATION_FRAGMENT,
                },
              ],
              outcomeText: null,
              continueButtonText: `${START} ${TIP_LENGTH_CAL_HEADER}`,
              noteBody: {
                preFragment: IT_IS,
                boldFragment: EXTREMELY,
                postFragment: NOTE_BODY_PRE_PROTOCOL,
              },
            }
          case INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL:
            return {
              headerText: PIP_AND_TIP_CAL_HEADER,
              invalidationText: TIP_LENGTH_INVALIDATES_PIPETTE_OFFSET,
              bodyContentFragments: [
                {
                  preFragment: null,
                  boldFragment: TIP_LENGTH_CAL_NAME_FRAGMENT,
                  postFragment: TIP_LENGTH_CAL_EXPLANATION_FRAGMENT,
                },
                {
                  preFragment: PIP_OFFSET_CAL_INTRO_FRAGMENT,
                  boldFragment: PIP_OFFSET_CAL_NAME_FRAGMENT,
                  postFragment: PIP_OFFSET_CAL_EXPLANATION_FRAGMENT,
                },
              ],
              outcomeText: null,
              continueButtonText: `${START} ${TIP_LENGTH_CAL_HEADER}`,
              noteBody: {
                preFragment: IT_IS,
                boldFragment: EXTREMELY,
                postFragment: NOTE_BODY_OUTSIDE_PROTOCOL,
              },
            }
          case INTENT_PIPETTE_OFFSET:
            return {
              headerText: PIP_AND_TIP_CAL_HEADER,
              invalidationText: PIP_OFFSET_REQUIRES_TIP_LENGTH,
              bodyContentFragments: [
                {
                  preFragment: null,
                  boldFragment: TIP_LENGTH_CAL_NAME_FRAGMENT,
                  postFragment: TIP_LENGTH_CAL_EXPLANATION_FRAGMENT,
                },
                {
                  preFragment: PIP_OFFSET_CAL_INTRO_FRAGMENT,
                  boldFragment: PIP_OFFSET_CAL_NAME_FRAGMENT,
                  postFragment: PIP_OFFSET_CAL_EXPLANATION_FRAGMENT,
                },
              ],
              outcomeText: null,
              continueButtonText: `${START} ${TIP_LENGTH_CAL_HEADER}`,
              noteBody: {
                preFragment: IT_IS,
                boldFragment: EXTREMELY,
                postFragment: NOTE_BODY_OUTSIDE_PROTOCOL,
              },
            }
          default:
            return {
              headerText: PIP_OFFSET_CAL_HEADER,
              invalidationText: null,
              bodyContentFragments: [
                {
                  preFragment: PIP_OFFSET_CAL_INTRO_FRAGMENT,
                  boldFragment: PIP_OFFSET_CAL_NAME_FRAGMENT,
                  postFragment: PIP_OFFSET_CAL_EXPLANATION_FRAGMENT,
                },
              ],
              outcomeText: null,
              continueButtonText: `${START} ${PIP_OFFSET_CAL_HEADER}`,
              noteBody: {
                preFragment: IT_IS,
                boldFragment: EXTREMELY,
                postFragment: NOTE_BODY_OUTSIDE_PROTOCOL,
              },
            }
        }
      } else {
        return {
          headerText: PIP_OFFSET_CAL_HEADER,
          invalidationText: null,
          bodyContentFragments: [
            {
              preFragment: PIP_OFFSET_CAL_INTRO_FRAGMENT,
              boldFragment: PIP_OFFSET_CAL_NAME_FRAGMENT,
              postFragment: PIP_OFFSET_CAL_EXPLANATION_FRAGMENT,
            },
          ],
          outcomeText: null,
          continueButtonText: `${START} ${PIP_OFFSET_CAL_HEADER}`,
          noteBody: {
            preFragment: IT_IS,
            boldFragment: EXTREMELY,
            postFragment: NOTE_BODY_OUTSIDE_PROTOCOL,
          },
        }
      }
    case Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK:
      return {
        headerText: HEALTH_CHECK_HEADER,
        invalidationText: HEALTH_CHECK_INTRO_FRAGMENT,
        bodyContentFragments: [
          {
            preFragment: null,
            boldFragment: null,
            postFragment: HEALTH_CHECK_EXPLANATION_FRAGMENT,
          },
        ],
        outcomeText: HEALTH_CHECK_PROMPT_FRAGMENT,
        continueButtonText: `${START} ${HEALTH_CHECK_HEADER}`,
        noteBody: {
          preFragment: null,
          boldFragment: null,
          postFragment: NOTE_HEALTH_CHECK_OUTCOMES,
        },
      }
    default:
      return {
        headerText: 'Error',
        invalidationText: 'This panel is shown in error',
        bodyContentFragments: [],
        continueButtonText: 'Error',
        outcomeText: null,
        noteBody: { preFragment: null, boldFragment: null, postFragment: null },
      }
  }
}

export function Introduction(props: CalibrationPanelProps): React.Node {
  const {
    tipRack,
    calBlock,
    sendCommands,
    sessionType,
    shouldPerformTipLength,
    intent,
  } = props

  const isExtendedPipOffset =
    sessionType === Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION &&
    shouldPerformTipLength

  const proceed = () =>
    sendCommands({ command: Sessions.sharedCalCommands.LOAD_LABWARE })

  const {
    headerText,
    invalidationText,
    bodyContentFragments,
    outcomeText,
    continueButtonText,
    noteBody,
  } = contentsByParams(sessionType, isExtendedPipOffset, intent)

  const isKnownTiprack = tipRack.loadName in labwareImages
  return (
    <>
      <Flex
        key={'intro'}
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
        {invalidationText && (
          <Text marginBottom={SPACING_3}>{invalidationText}</Text>
        )}
        <Box marginBottom={SPACING_3}>
          {bodyContentFromFragments(bodyContentFragments)}
        </Box>
        {outcomeText && <Text marginBottom={SPACING_3}>{outcomeText}</Text>}
        <Box marginX="5%">
          <h5>{LABWARE_REQS}</h5>
          <Flex
            flexDirection={DIRECTION_ROW}
            marginTop={SPACING_2}
            justifyContent={JUSTIFY_CENTER}
          >
            <RequiredLabwareCard
              loadName={tipRack.loadName}
              displayName={getLabwareDisplayName(tipRack.definition)}
              linkToMeasurements={isKnownTiprack}
            />
            {/* TODO: AA 2020-10-26 load both required tipracks for multi-pipette health check when the other tiprack info is available */}
            {calBlock && (
              <>
                <Box width={SPACING_2} />
                <RequiredLabwareCard
                  loadName={calBlock.loadName}
                  displayName={getLabwareDisplayName(calBlock.definition)}
                  linkToMeasurements={false}
                />
              </>
            )}
          </Flex>
          <Box fontSize={FONT_SIZE_BODY_1} marginTop={SPACING_2}>
            <Text
              display={DISPLAY_INLINE}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              textTransform={TEXT_TRANSFORM_UPPERCASE}
            >
              {NOTE_HEADER}
            </Text>
            &nbsp;
            {bodyContentFromFragments([noteBody])}
          </Box>
        </Box>
      </Flex>
      <Flex width="100%" justifyContent={JUSTIFY_CENTER}>
        <PrimaryBtn
          data-test="continueButton"
          onClick={proceed}
          flex="1"
          margin="1rem 5rem 1rem"
        >
          {continueButtonText}
        </PrimaryBtn>
      </Flex>
    </>
  )
}

type RequiredLabwareCardProps = {|
  loadName: string,
  displayName: string,
  linkToMeasurements?: boolean,
|}

const linkStyles = css`
  &:hover {
    background-color: ${C_NEAR_WHITE};
  }
`

function RequiredLabwareCard(props: RequiredLabwareCardProps) {
  const { loadName, displayName, linkToMeasurements } = props
  const imageSrc =
    loadName in labwareImages
      ? labwareImages[loadName]
      : labwareImages['generic_custom_tiprack']

  return (
    <Flex
      width="50%"
      border={BORDER_SOLID_MEDIUM}
      paddingX={SPACING_3}
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
    >
      <Flex
        paddingY={SPACING_3}
        height="75%"
        width="75%"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
      >
        <img
          css={css`
            width: 100%;
            max-height: 100%;
          `}
          src={imageSrc}
        />
      </Flex>
      <Text fontSize={FONT_SIZE_BODY_2}>{displayName}</Text>
      {linkToMeasurements && (
        <Link
          external
          paddingY={SPACING_3}
          flex="0.6"
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          textAlign={TEXT_ALIGN_CENTER}
          fontSize={FONT_SIZE_BODY_1}
          color="inherit"
          css={linkStyles}
          href={`${LABWARE_LIBRARY_PAGE_PATH}/${loadName}`}
        >
          {VIEW_TIPRACK_MEASUREMENTS}
        </Link>
      )}
    </Flex>
  )
}
