// @flow
import * as React from 'react'
import map from 'lodash/map'
import startCase from 'lodash/startCase'
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
  C_WHITE,
  C_NEAR_WHITE,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import * as Sessions from '../../sessions'
import type { SessionType, SessionCommandString } from '../../sessions/types'
import type { CalibrationPanelProps } from './types'
import { CalibrationLabwareRender } from './CalibrationLabwareRender'
import styles from './styles.css'

const FIRST_RANK_TO_CHECK = 'To check'
const SECOND_RANK_TO_CHECK = 'In order to check'
const FIRST_RANK_PLACE_FULL = 'pipette, place a full'
const SECOND_RANK_PLACE_FULL = 'pipette, switch out the tiprack for a full'
const PLACE_A_FULL = 'Place a full'
const TIPRACK = 'tip rack'
const DECK_SETUP_WITH_BLOCK_PROMPT =
  'and Calibration Block on the deck within their designated slots as illustrated below.'
const DECK_SETUP_NO_BLOCK_PROMPT = 'on the deck within the designated slot as illustrated below'
const DECK_SETUP_BUTTON_TEXT = 'Confirm placement and continue'
const contentsBySessionType: {
  [SessionType]: {
    moveCommandString: SessionCommandString,
  },
} = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: {
    moveCommandString: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
  },
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]: {
    moveCommandString: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
  },
  [Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK]: {
    moveCommandString: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
  },
  [Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION]: {
    moveCommandString: Sessions.sharedCalCommands.MOVE_TO_REFERENCE_POINT,
  },
}

function getHealthCheckText(
  mount?: string | null,
  rank?: string | null
): string {
  if (!mount || !rank) {
    return ''
  }
  const toCheck = rank === 'first' ? FIRST_RANK_TO_CHECK : SECOND_RANK_TO_CHECK
  const placeFull = rank === 'first' ? FIRST_RANK_PLACE_FULL : SECOND_RANK_PLACE_FULL
  return `${toCheck} ${mount.toLowerCase()} ${placeFull}`
}

export function DeckSetup(props: CalibrationPanelProps): React.Node {
  const deckDef = React.useMemo(() => getDeckDefinitions()['ot2_standard'], [])

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

  const lookupType = isExtendedPipOffset
    ? Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION
    : sessionType
  const isHealthCheck =
    sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK

  const proceed = () => {
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
          {isHealthCheck
            ? getHealthCheckText(activePipette?.mount, activePipette?.rank)
            : PLACE_A_FULL}
          <b>{` ${tipRackDisplayName} `}</b>
          {calBlock ? DECK_SETUP_WITH_BLOCK_PROMPT : DECK_SETUP_NO_BLOCK_PROMPT}
          .
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
              (slot: $Values<typeof deckSlotsById>, slotId) => {
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
