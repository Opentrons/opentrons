import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'

import {
  ALIGN_CENTER,
  ALIGN_STRETCH,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  PrimaryButton,
  RobotWorkSpace,
  SPACING,
} from '@opentrons/components'
import {
  coordinateTupleToVector3D,
  getDeckDefinitions,
  getDeckSlotOriginToLabwareOrigin,
  getLabwareDisplayName,
  getPositionFromSlotId,
  getVectorSum,
} from '@opentrons/shared-data'

import { NeedHelpLink } from '/app/molecules/OT2CalibrationNeedHelpLink'
import * as Sessions from '/app/redux/sessions'

import { CalibrationLabwareRender } from './CalibrationLabwareRender'

import type { ReactNode } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'
import type { CalibrationPanelProps } from './types'

const TIPRACK = 'tip rack'
const DECK_VIEW_BOX = '-46 -10 488 390'

export function DeckSetup(props: CalibrationPanelProps): ReactNode {
  const deckDef = useMemo(() => getDeckDefinitions().ot2_standard, [])

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
          <LegacyStyledText forwardedAs="h1" marginBottom={SPACING.spacing16}>
            {t('prepare_the_space')}
          </LegacyStyledText>
          {isHealthCheck ? (
            <LegacyStyledText forwardedAs="p">
              {t('to_check', { mount: activePipette?.mount })}
            </LegacyStyledText>
          ) : null}
          <Flex marginLeft={SPACING.spacing32}>
            <ul>
              <li>
                <LegacyStyledText forwardedAs="p">
                  {t('place_full_tip_rack', {
                    tip_rack: isHealthCheck
                      ? activePipette?.tipRackDisplay
                      : tipRackDisplayName,
                  })}
                </LegacyStyledText>
              </li>
              {calBlock != null ? (
                <li>
                  <LegacyStyledText forwardedAs="p">
                    {t('place_cal_block')}
                  </LegacyStyledText>
                </li>
              ) : null}
              {isHealthCheck ? (
                <li>
                  <LegacyStyledText forwardedAs="p">
                    {t('clear_other_slots')}
                  </LegacyStyledText>
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
            viewBox={DECK_VIEW_BOX}
          >
            {({ addressableAreasById }) =>
              map(
                addressableAreasById,
                (addressableArea, addressableAreaName) => {
                  if (!addressableArea.matingSurfaceUnitVector) {
                    // if slot has no mating surface, don't render anything in it
                    return null
                  }

                  const labwareDef = ((): LabwareDefinition | null => {
                    if (
                      tipRack?.slot != null &&
                      Sessions.slotNameFromCalibrationSlot(tipRack?.slot) ===
                        addressableAreaName
                    ) {
                      return tipRack.definition
                    } else if (
                      calBlock?.slot != null &&
                      Sessions.slotNameFromCalibrationSlot(calBlock?.slot) ===
                        addressableAreaName
                    ) {
                      return calBlock.definition
                    } else {
                      return null
                    }
                  })()
                  if (labwareDef == null) {
                    return null
                  }

                  const slotOrigin = getPositionFromSlotId(
                    addressableArea.id,
                    deckDef
                  )
                  if (slotOrigin == null) {
                    return null // Shouldn't happen.
                  }

                  const slotOriginToLabwareOrigin =
                    getDeckSlotOriginToLabwareOrigin(
                      addressableArea,
                      labwareDef
                    )
                  const labwarePosition = getVectorSum(
                    coordinateTupleToVector3D(slotOrigin),
                    slotOriginToLabwareOrigin
                  )

                  return labwareDef != null ? (
                    <CalibrationLabwareRender
                      key={addressableAreaName}
                      labwarePosition={labwarePosition}
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
