import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { RobotMotionLoader } from './RobotMotionLoader'
import { PrepareSpace } from './PrepareSpace'
import {
  CompletedProtocolAnalysis,
  CreateCommand,
  getLabwareDisplayName,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getLabwareDef } from './utils/labware'
import { UnorderedList } from '../../molecules/UnorderedList'
import { useChainRunCommands } from '../../resources/runs/hooks'
import { getDisplayLocation } from './utils/getDisplayLocation'

import type { VectorOffset } from '@opentrons/api-client'
import type { ReturnTipStep } from './types'

interface ReturnTipProps extends ReturnTipStep {
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  chainRunCommands: ReturnType<typeof useChainRunCommands>['chainRunCommands']
  setFatalError: (errorMessage: string) => void
  tipPickUpOffset: VectorOffset | null
  isRobotMoving: boolean
}
export const ReturnTip = (props: ReturnTipProps): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const {
    pipetteId,
    labwareId,
    location,
    protocolData,
    proceed,
    tipPickUpOffset,
    isRobotMoving,
    chainRunCommands,
    setFatalError,
  } = props

  const labwareDef = getLabwareDef(labwareId, protocolData)
  if (labwareDef == null) return null

  const displayLocation = getDisplayLocation(location, t)
  const labwareDisplayName = getLabwareDisplayName(labwareDef)

  const instructions = [
    t('clear_all_slots'),
    <Trans
      key="place_previous_tip_rack_in_location"
      t={t}
      i18nKey="place_previous_tip_rack_in_location"
      tOptions={{ tip_rack: labwareDisplayName, location: displayLocation }}
      components={{
        bold: (
          <StyledText as="span" fontWeight={TYPOGRAPHY.fontWeightSemiBold} />
        ),
      }}
    />,
  ]

  const handleConfirmPlacement = (): void => {
    const modulePrepCommands = protocolData.modules.reduce<CreateCommand[]>(
      (acc, module) => {
        if (getModuleType(module.model) === HEATERSHAKER_MODULE_TYPE) {
          return [
            ...acc,
            {
              commandType: 'heaterShaker/closeLabwareLatch',
              params: { moduleId: module.id },
            },
          ]
        }
        return acc
      },
      []
    )
    chainRunCommands(
      [
        ...modulePrepCommands,
        {
          commandType: 'moveLabware' as const,
          params: {
            labwareId: labwareId,
            newLocation: location,
            strategy: 'manualMoveWithoutPause',
          },
        },
        {
          commandType: 'moveToWell' as const,
          params: {
            pipetteId: pipetteId,
            labwareId: labwareId,
            wellName: 'A1',
            wellLocation: {
              origin: 'top' as const,
              offset: tipPickUpOffset ?? undefined,
            },
          },
        },
        {
          commandType: 'dropTip' as const,
          params: {
            pipetteId: pipetteId,
            labwareId: labwareId,
            wellName: 'A1',
            wellLocation: {
              origin: 'top' as const,
              offset: tipPickUpOffset ?? undefined,
            },
          },
        },
        {
          commandType: 'moveLabware' as const,
          params: {
            labwareId: labwareId,
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
        { commandType: 'home' as const, params: {} },
      ],
      false
    )
      .then(() => {
        proceed()
      })
      .catch((e: Error) => {
        setFatalError(`ReturnTip failed with message: ${e.message}`)
      })
  }

  if (isRobotMoving)
    return (
      <RobotMotionLoader header={t('shared:stand_back_robot_is_in_motion')} />
    )
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <PrepareSpace
        {...props}
        header={t('return_tip_rack_to_location', { location: displayLocation })}
        body={<UnorderedList items={instructions} />}
        labwareDef={labwareDef}
        confirmPlacement={handleConfirmPlacement}
      />
    </Flex>
  )
}
