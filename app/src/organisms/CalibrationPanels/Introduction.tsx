import * as React from 'react'
import { css } from 'styled-components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import {
  Box,
  Flex,
  Link,
  PrimaryBtn,
  Text,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDER_SOLID_MEDIUM,
  C_MED_DARK_GRAY,
  C_NEAR_WHITE,
  DIRECTION_COLUMN,
  DISPLAY_INLINE,
  FLEX_MIN_CONTENT,
  FONT_HEADER_DARK,
  FONT_SIZE_BODY_1,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_RELATIVE,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  TEXT_TRANSFORM_UPPERCASE,
  SecondaryBtn,
} from '@opentrons/components'

import * as Sessions from '../../redux/sessions'
import { labwareImages } from './labwareImages'
import { NeedHelpLink } from './NeedHelpLink'
import { ChooseTipRack } from './ChooseTipRack'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { SessionType } from '../../redux/sessions/types'
import type { CalibrationPanelProps, Intent } from './types'
import {
  INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
  INTENT_TIP_LENGTH_IN_PROTOCOL,
  INTENT_CALIBRATE_PIPETTE_OFFSET,
  INTENT_RECALIBRATE_PIPETTE_OFFSET,
  TRASH_BIN_LOAD_NAME,
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
  'You don’t have a tip length saved with this pipette yet. You will need to calibrate tip length before calibrating your pipette offset.'

const TIP_LENGTH_CAL_HEADER = 'tip length calibration'
const TIP_LENGTH_CAL_NAME_FRAGMENT = 'Tip length'
const TIP_LENGTH_CAL_EXPLANATION_FRAGMENT =
  "calibration measures the length of the pipette's tip separately from the pipette's nozzle."
const TIP_LENGTH_INVALIDATES_PIPETTE_OFFSET =
  'This tip was used to calibrate this pipette’s offset. Recalibrating this tip’s length will invalidate this pipette’s offset. If you recalibrate this tip length, you will need to recalibrate this pipette offset afterwards.'

const CHOOSE_TIP_RACK_BUTTON_TEXT = 'Use a different tip rack'
const START = 'start'
const PIP_AND_TIP_CAL_HEADER = 'tip length and pipette offset calibration'
const LABWARE_REQS = 'You will need:'
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
const TRASH_BIN = 'Removable black plastic trash bin'

interface BodySpec {
  preFragment: string | null
  boldFragment: string | null
  postFragment: string | null
}

interface PanelContents {
  headerText: string
  invalidationText: string | null
  bodyContentFragments: BodySpec[]
  outcomeText: string | null
  chooseTipRackButtonText: string | null
  continueButtonText: string
  noteBody: BodySpec
}

const bodyContentFromFragments = (
  contentFragments: BodySpec[]
): JSX.Element => {
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
        /*
          Without passing an initial value into reduce and using generic typing, there is no way to tell TS that the reduced value is of a different type than the acc and val
          Could do this, but it is a behavioral change bcuz the initial val would no longer be the first value in the array:
          .reduce<React.ReactNode[]>((prev, current) => [prev, ' ', current], [])}
        */
        // @ts-expect-error(sa, 2021-05-27): avoiding src code change
        .reduce((prev, current) => [prev, ' ', current])}
    </>
  )
}

const contentsByParams = (
  sessionType: SessionType,
  isExtendedPipOffset?: boolean | null,
  intent?: Intent
): PanelContents => {
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
        chooseTipRackButtonText: CHOOSE_TIP_RACK_BUTTON_TEXT,
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
        chooseTipRackButtonText: null,
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
              chooseTipRackButtonText: null,
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
              chooseTipRackButtonText: CHOOSE_TIP_RACK_BUTTON_TEXT,
              outcomeText: null,
              continueButtonText: `${START} ${TIP_LENGTH_CAL_HEADER}`,
              noteBody: {
                preFragment: IT_IS,
                boldFragment: EXTREMELY,
                postFragment: NOTE_BODY_OUTSIDE_PROTOCOL,
              },
            }
          case INTENT_CALIBRATE_PIPETTE_OFFSET:
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
              chooseTipRackButtonText: CHOOSE_TIP_RACK_BUTTON_TEXT,
              continueButtonText: `${START} ${TIP_LENGTH_CAL_HEADER}`,
              noteBody: {
                preFragment: IT_IS,
                boldFragment: EXTREMELY,
                postFragment: NOTE_BODY_OUTSIDE_PROTOCOL,
              },
            }
          case INTENT_RECALIBRATE_PIPETTE_OFFSET:
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
              chooseTipRackButtonText: CHOOSE_TIP_RACK_BUTTON_TEXT,
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
              chooseTipRackButtonText: CHOOSE_TIP_RACK_BUTTON_TEXT,
              continueButtonText: `${START} ${PIP_OFFSET_CAL_HEADER}`,
              noteBody: {
                preFragment: IT_IS,
                boldFragment: EXTREMELY,
                postFragment: NOTE_BODY_OUTSIDE_PROTOCOL,
              },
            }
        }
      } else {
        switch (intent) {
          case INTENT_RECALIBRATE_PIPETTE_OFFSET:
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
              chooseTipRackButtonText: null,
              continueButtonText: `${START} ${PIP_OFFSET_CAL_HEADER}`,
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
              chooseTipRackButtonText: null,
              continueButtonText: `${START} ${PIP_OFFSET_CAL_HEADER}`,
              noteBody: {
                preFragment: IT_IS,
                boldFragment: EXTREMELY,
                postFragment: NOTE_BODY_OUTSIDE_PROTOCOL,
              },
            }
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
        chooseTipRackButtonText: null,
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
        chooseTipRackButtonText: null,
        outcomeText: null,
        noteBody: { preFragment: null, boldFragment: null, postFragment: null },
      }
  }
}

export function Introduction(props: CalibrationPanelProps): JSX.Element {
  const {
    tipRack,
    calBlock,
    sendCommands,
    sessionType,
    shouldPerformTipLength,
    intent,
    instruments,
    supportedCommands,
  } = props

  const [showChooseTipRack, setShowChooseTipRack] = React.useState(false)
  const [
    chosenTipRack,
    setChosenTipRack,
  ] = React.useState<LabwareDefinition2 | null>(null)

  const handleChosenTipRack = (value: LabwareDefinition2 | null): void => {
    value && setChosenTipRack(value)
  }
  const isExtendedPipOffset: boolean | null | undefined =
    sessionType === Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION &&
    shouldPerformTipLength
  const uniqueTipRacks = new Set(
    instruments?.map(instr => instr.tipRackLoadName)
  )

  const proceed = (): void => {
    if (
      supportedCommands &&
      supportedCommands.includes(Sessions.sharedCalCommands.LOAD_LABWARE)
    ) {
      sendCommands({
        command: Sessions.sharedCalCommands.LOAD_LABWARE,
        data: { tiprackDefinition: chosenTipRack ?? tipRack.definition },
      })
    } else {
      sendCommands({ command: Sessions.sharedCalCommands.LOAD_LABWARE })
    }
  }

  const {
    headerText,
    invalidationText,
    bodyContentFragments,
    outcomeText,
    chooseTipRackButtonText,
    continueButtonText,
    noteBody,
  } = contentsByParams(sessionType, isExtendedPipOffset, intent)

  const isKnownTiprack = tipRack.loadName in labwareImages
  return showChooseTipRack ? (
    <ChooseTipRack
      tipRack={props.tipRack}
      mount={props.mount}
      sessionType={props.sessionType}
      chosenTipRack={chosenTipRack}
      handleChosenTipRack={handleChosenTipRack}
      closeModal={() => setShowChooseTipRack(false)}
      robotName={props.robotName}
      defaultTipracks={props.defaultTipracks}
    />
  ) : (
    <>
      <Flex
        key={'intro'}
        marginY={SPACING_2}
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_FLEX_START}
        position={POSITION_RELATIVE}
        fontSize={FONT_SIZE_BODY_2}
      >
        <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Text
            css={FONT_HEADER_DARK}
            marginBottom={SPACING_3}
            textTransform={TEXT_TRANSFORM_UPPERCASE}
          >
            {headerText}
          </Text>
          <NeedHelpLink />
        </Flex>
        {invalidationText && (
          <Text marginBottom={SPACING_3}>{invalidationText}</Text>
        )}
        <Box marginBottom={SPACING_3}>
          {bodyContentFromFragments(bodyContentFragments)}
        </Box>
        {outcomeText && <Text marginBottom={SPACING_3}>{outcomeText}</Text>}
        <Flex
          marginX="20%"
          marginBottom={SPACING_2}
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_CENTER}
          minHeight="18.75rem"
          maxHeight="25rem"
        >
          <Text fontWeight={FONT_WEIGHT_SEMIBOLD} marginBottom={SPACING_3}>
            {LABWARE_REQS}
          </Text>
          {uniqueTipRacks.size > 1 ? (
            instruments?.map(instr => {
              return (
                <RequiredLabwareCard
                  key={instr.tipRackUri}
                  loadName={instr.tipRackLoadName}
                  displayName={instr.tipRackDisplay}
                  linkToMeasurements={instr.tipRackLoadName in labwareImages}
                />
              )
            })
          ) : chosenTipRack ? (
            <RequiredLabwareCard
              loadName={chosenTipRack.parameters.loadName}
              displayName={chosenTipRack.metadata.displayName}
              linkToMeasurements={
                chosenTipRack.parameters.loadName in labwareImages
              }
            />
          ) : (
            <RequiredLabwareCard
              loadName={tipRack.loadName}
              displayName={getLabwareDisplayName(tipRack.definition)}
              linkToMeasurements={isKnownTiprack}
            />
          )}
          {calBlock ? (
            <>
              <Box width={SPACING_2} />
              <RequiredLabwareCard
                loadName={calBlock.loadName}
                displayName={getLabwareDisplayName(calBlock.definition)}
                linkToMeasurements={false}
              />
            </>
          ) : (
            (sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK ||
              sessionType === Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION ||
              isExtendedPipOffset) && (
              <RequiredLabwareCard
                loadName={TRASH_BIN_LOAD_NAME}
                displayName={TRASH_BIN}
                linkToMeasurements={false}
              />
            )
          )}
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
        </Flex>
      </Flex>
      <Flex
        width="100%"
        justifyContent={JUSTIFY_CENTER}
        paddingX={chooseTipRackButtonText ? '0' : '5rem'}
      >
        {chooseTipRackButtonText && (
          <SecondaryBtn
            data-test="chooseTipRackButton"
            onClick={() => setShowChooseTipRack(true)}
            width="48%"
            marginRight="1rem"
          >
            {chooseTipRackButtonText}
          </SecondaryBtn>
        )}
        <PrimaryBtn data-test="continueButton" onClick={proceed} flex="1">
          {continueButtonText}
        </PrimaryBtn>
      </Flex>
    </>
  )
}

interface RequiredLabwareCardProps {
  loadName: string
  displayName: string
  linkToMeasurements?: boolean
}

const linkStyles = css`
  &:hover {
    background-color: ${C_NEAR_WHITE};
  }
`

function RequiredLabwareCard(props: RequiredLabwareCardProps): JSX.Element {
  const { loadName, displayName, linkToMeasurements } = props
  const imageSrc =
    loadName in labwareImages
      ? labwareImages[loadName as keyof typeof labwareImages]
      : labwareImages.generic_custom_tiprack

  return (
    <Flex
      width="100%"
      height="30%"
      border={BORDER_SOLID_MEDIUM}
      paddingX={SPACING_3}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      marginBottom={SPACING_2}
    >
      <Flex
        paddingY={SPACING_2}
        height="6rem"
        flex="0 1 30%"
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        <img
          css={css`
            max-width: 100%;
            max-height: 100%;
            flex: 0 1 5rem;
            display: block;
          `}
          src={imageSrc}
        />
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingLeft={SPACING_3}
        flex="0 1 70%"
      >
        <Text fontSize={FONT_SIZE_BODY_2}>{displayName}</Text>
        {linkToMeasurements && (
          <Link
            external
            flex={FLEX_MIN_CONTENT}
            paddingY={SPACING_1}
            width="9.25rem"
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            fontSize={FONT_SIZE_BODY_2}
            color={C_MED_DARK_GRAY}
            css={linkStyles}
            href={`${LABWARE_LIBRARY_PAGE_PATH}/${loadName}`}
          >
            {VIEW_TIPRACK_MEASUREMENTS}
          </Link>
        )}
      </Flex>
    </Flex>
  )
}
