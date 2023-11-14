import * as React from 'react'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'
import {
  RobotWorkSpace,
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  ALIGN_STRETCH,
  SPACING,
  PrimaryButton,
} from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import * as Sessions from '../../redux/sessions'
import { StyledText } from '../../atoms/text'
import { NeedHelpLink } from './NeedHelpLink'
import { CalibrationLabwareRender } from './CalibrationLabwareRender'

import type { CalibrationPanelProps } from './types'

const TIPRACK = 'tip rack'

export function DeckSetup(props: CalibrationPanelProps): JSX.Element {
  const deckDef = React.useMemo(() => getDeckDefinitions().ot2_standard, [])

  const { t } = useTranslation('robot_calibration')

  const { tipRack, calBlock, sendCommands, sessionType, activePipette } = props

  const isHealthCheck =
    sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK

  const proceed = (): void => {
    sendCommands({
      command:
        sessionType === Sessions.SESSION_TYPE_DECK_CALIBRATION ||
        sessionType === Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
          ? Sessions.sharedCalCommands.MOVE_TO_TIP_RACK
          : Sessions.sharedCalCommands.MOVE_TO_REFERENCE_POINT,
    })
  }
  const tipRackDisplayName =
    getLabwareDisplayName(tipRack?.definition) ?? TIPRACK
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="25rem"
    >
      <Flex>
        <Flex flex="1" flexDirection={DIRECTION_COLUMN}>
          <StyledText as="h1" marginBottom={SPACING.spacing16}>
            {t('prepare_the_space')}
          </StyledText>
          {isHealthCheck ? (
            <StyledText as="p">
              {t('to_check', { mount: activePipette?.mount })}
            </StyledText>
          ) : null}
          <Flex marginLeft={SPACING.spacing32}>
            <ul>
              <li>
                <StyledText as="p">
                  {t('place_full_tip_rack', {
                    tip_rack: isHealthCheck
                      ? activePipette?.tipRackDisplay
                      : tipRackDisplayName,
                  })}
                </StyledText>
              </li>
              {calBlock != null ? (
                <li>
                  <StyledText as="p">{t('place_cal_block')}</StyledText>
                </li>
              ) : null}
              {isHealthCheck ? (
                <li>
                  <StyledText as="p">{t('clear_other_slots')}</StyledText>
                </li>
              ) : null}
            </ul>
          </Flex>
        </Flex>
        <Flex flex="1 1 0" alignSelf={ALIGN_STRETCH}>
          <RobotWorkSpace
            deckLayerBlocklist={[
              'fixedBase',
              'doorStops',
              'metalFrame',
              'removalHandle',
              'removableDeckOutline',
              'screwHoles',
              'calibrationMarkings',
              'fixedTrash',
            ]}
            deckDef={deckDef}
            showDeckLayers
            viewBox={`-46 -10 ${488} ${390}`} // TODO: put these in variables
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
                  } else if (
                    calBlock != null &&
                    String(calBlock?.slot) === slotId
                  ) {
                    labwareDef = calBlock?.definition
                  }

                  return labwareDef != null ? (
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
      </Flex>
      <Flex
        width="100%"
        marginTop={SPACING.spacing32}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <NeedHelpLink />
        <PrimaryButton onClick={proceed}>
          {t('confirm_placement')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
