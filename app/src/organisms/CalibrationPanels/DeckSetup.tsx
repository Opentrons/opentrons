import * as React from 'react'
import map from 'lodash/map'
import {
  RobotWorkSpace,
  Flex,
  Text,
  LightSecondaryBtn,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  ALIGN_STRETCH,
  TEXT_ALIGN_CENTER,
  FONT_SIZE_HEADER,
  FONT_WEIGHT_SEMIBOLD,
  C_WHITE,
  C_NEAR_WHITE,
  COLOR_WARNING,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import * as Sessions from '../../redux/sessions'
import type {
  SessionType,
  SessionCommandString,
  CalibrationCheckInstrument,
  CalibrationLabware,
} from '../../redux/sessions/types'
import type { CalibrationPanelProps } from './types'
import { CalibrationLabwareRender } from './CalibrationLabwareRender'
import styles from './styles.css'

const FIRST_RANK_TO_CHECK = 'To check'
const SECOND_RANK_TO_CHECK = 'Before we proceed to check the'
const PIPETTE = 'pipette'
const FIRST_RANK_PLACE_FULL = 'clear the deck and place a full'
const SECOND_RANK_PLACE_FULL = 'switch out the tiprack for a full'
const CLEAR_AND_PLACE_A_FULL = 'Clear the deck and place a full'
const TIPRACK = 'tip rack'
const DECK_SETUP_WITH_BLOCK_PROMPT =
  'and Calibration Block on the deck within their designated slots as illustrated below'
const DECK_SETUP_NO_BLOCK_PROMPT =
  'on the deck within the designated slot as illustrated below'
const SECOND_RANK_WITH_BLOCK_PROMPT =
  'and ensure Calibration Block is within its designated slot as illustrated below'
const SECOND_RANK_NO_BLOCK_PROMPT = 'as illustrated below'
const DECK_SETUP_BUTTON_TEXT = 'Confirm placement and continue'
const contentsBySessionType: Record<
  SessionType,
  { moveCommandString: SessionCommandString }
> = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: {
    moveCommandString: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
  },
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]: {
    moveCommandString: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
  },
  [Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK]: {
    moveCommandString: Sessions.sharedCalCommands.MOVE_TO_REFERENCE_POINT,
  },
  [Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION]: {
    moveCommandString: Sessions.sharedCalCommands.MOVE_TO_REFERENCE_POINT,
  },
}

function HealthCheckText({
  activePipette,
  calBlock,
}: {
  activePipette?: CalibrationCheckInstrument | null
  calBlock?: CalibrationLabware | null
}): JSX.Element | null {
  if (!activePipette) return null
  const { mount, rank, tipRackDisplay } = activePipette
  const toCheck = rank === 'first' ? FIRST_RANK_TO_CHECK : SECOND_RANK_TO_CHECK
  const placeFull =
    rank === 'first' ? FIRST_RANK_PLACE_FULL : SECOND_RANK_PLACE_FULL
  const firstCalBlockPortion = calBlock
    ? DECK_SETUP_WITH_BLOCK_PROMPT
    : DECK_SETUP_NO_BLOCK_PROMPT
  const secondCalBlockPortion = calBlock
    ? SECOND_RANK_WITH_BLOCK_PROMPT
    : SECOND_RANK_NO_BLOCK_PROMPT
  return (
    <>
      {`${toCheck} ${mount.toLowerCase()} ${PIPETTE}, `}
      <Text
        as="span"
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        color={rank === 'second' ? COLOR_WARNING : C_WHITE}
      >{`${placeFull} ${tipRackDisplay} `}</Text>
      {rank === 'first' ? firstCalBlockPortion : secondCalBlockPortion}.
    </>
  )
}

export function DeckSetup(props: CalibrationPanelProps): JSX.Element {
  const deckDef = React.useMemo(() => getDeckDefinitions().ot2_standard, [])

  const {
    tipRack,
    calBlock,
    sendCommands,
    sessionType,
    activePipette,
    shouldPerformTipLength,
  } = props

  const isExtendedPipOffset =
    sessionType === Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION &&
    shouldPerformTipLength

  const lookupType: SessionType = isExtendedPipOffset
    ? Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION
    : sessionType
  const isHealthCheck =
    sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK

  const proceed = (): void => {
    sendCommands({
      command: contentsBySessionType[lookupType].moveCommandString,
    })
  }
  const tipRackDisplayName =
    getLabwareDisplayName(tipRack?.definition) ?? TIPRACK
  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        <Text
          color={C_WHITE}
          fontSize={FONT_SIZE_HEADER}
          marginY={SPACING_2}
          textAlign={TEXT_ALIGN_CENTER}
        >
          {isHealthCheck ? (
            <HealthCheckText {...{ activePipette, calBlock }} />
          ) : (
            `${CLEAR_AND_PLACE_A_FULL} ${tipRackDisplayName} ${
              calBlock
                ? DECK_SETUP_WITH_BLOCK_PROMPT
                : DECK_SETUP_NO_BLOCK_PROMPT
            }.`
          )}
        </Text>
        <LightSecondaryBtn
          onClick={proceed}
          alignSelf={ALIGN_CENTER}
          margin={`${SPACING_2} 0 ${SPACING_3} 0`}
        >
          {`${DECK_SETUP_BUTTON_TEXT}`}
        </LightSecondaryBtn>
      </Flex>
      <Flex
        flex="1 1 0"
        alignSelf={ALIGN_STRETCH}
        backgroundColor={C_NEAR_WHITE}
        borderRadius="6px"
      >
        <RobotWorkSpace
          deckLayerBlocklist={[
            'fixedBase',
            'doorStops',
            'metalFrame',
            'removalHandle',
            'removableDeckOutline',
            'screwHoles',
            'calibrationMarkings',
          ]}
          deckDef={deckDef}
          viewBox={`-46 -10 ${488} ${390}`} // TODO: put these in variables
          className={styles.deck_map}
        >
          {({ deckSlotsById }) =>
            map(
              deckSlotsById,
              (
                slot: typeof deckSlotsById[keyof typeof deckSlotsById],
                slotId
              ) => {
                if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render anything in it
                let labwareDef = null
                if (String(tipRack?.slot) === slotId) {
                  labwareDef = tipRack?.definition
                } else if (calBlock && String(calBlock?.slot) === slotId) {
                  labwareDef = calBlock?.definition
                }

                return labwareDef ? (
                  <CalibrationLabwareRender
                    key={slotId}
                    slotDef={slot}
                    labwareDef={labwareDef}
                  />
                ) : null
              }
            )
          }
        </RobotWorkSpace>
      </Flex>
    </>
  )
}
