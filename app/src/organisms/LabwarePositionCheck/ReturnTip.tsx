import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, TYPOGRAPHY } from '@opentrons/components'
import {
  CompletedProtocolAnalysis,
  CreateCommand,
  getLabwareDisplayName,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  MoveLabwareCreateCommand,
  RobotType,
} from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { UnorderedList } from '../../molecules/UnorderedList'
import { useChainRunCommands } from '../../resources/runs/hooks'
import {
  getLabwareDef,
  getLabwareDefinitionsFromCommands,
} from './utils/labware'
import { getDisplayLocation } from './utils/getDisplayLocation'
import { RobotMotionLoader } from './RobotMotionLoader'
import { PrepareSpace } from './PrepareSpace'
import { useSelector } from 'react-redux'
import { getIsOnDevice } from '../../redux/config'

import type { VectorOffset } from '@opentrons/api-client'
import type { ReturnTipStep } from './types'

interface ReturnTipProps extends ReturnTipStep {
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  chainRunCommands: ReturnType<typeof useChainRunCommands>['chainRunCommands']
  setFatalError: (errorMessage: string) => void
  tipPickUpOffset: VectorOffset | null
  isRobotMoving: boolean
  robotType: RobotType
}
export const ReturnTip = (props: ReturnTipProps): JSX.Element | null => {
  const { t, i18n } = useTranslation(['labware_position_check', 'shared'])
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
    adapterId,
  } = props

  const isOnDevice = useSelector(getIsOnDevice)

  const labwareDef = getLabwareDef(labwareId, protocolData)
  if (labwareDef == null) return null

  const displayLocation = getDisplayLocation(
    location,
    getLabwareDefinitionsFromCommands(protocolData.commands),
    t,
    i18n
  )
  const labwareDisplayName = getLabwareDisplayName(labwareDef)

  const instructions = [
    isOnDevice ? t('clear_all_slots_odd') : t('clear_all_slots'),
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

  let moveLabware: MoveLabwareCreateCommand[]
  if (adapterId != null) {
    moveLabware = [
      {
        commandType: 'moveLabware' as const,
        params: {
          labwareId: adapterId,
          newLocation: { slotName: location.slotName },
          strategy: 'manualMoveWithoutPause',
        },
      },
      {
        commandType: 'moveLabware' as const,
        params: {
          labwareId,
          newLocation:
            adapterId != null
              ? { labwareId: adapterId }
              : { slotName: location.slotName },
          strategy: 'manualMoveWithoutPause',
        },
      },
    ]
  } else {
    moveLabware = [
      {
        commandType: 'moveLabware' as const,
        params: {
          labwareId,
          newLocation: location,
          strategy: 'manualMoveWithoutPause',
        },
      },
    ]
  }

  const moveLabwareOffDeck: MoveLabwareCreateCommand[] =
    adapterId != null
      ? [
          {
            commandType: 'moveLabware' as const,
            params: {
              labwareId: labwareId,
              newLocation: 'offDeck',
              strategy: 'manualMoveWithoutPause',
            },
          },
          {
            commandType: 'moveLabware' as const,
            params: {
              labwareId: adapterId,
              newLocation: 'offDeck',
              strategy: 'manualMoveWithoutPause',
            },
          },
        ]
      : [
          {
            commandType: 'moveLabware' as const,
            params: {
              labwareId: labwareId,
              newLocation: 'offDeck',
              strategy: 'manualMoveWithoutPause',
            },
          },
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
        ...moveLabware,
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
              origin: 'default' as const,
              offset: tipPickUpOffset ?? undefined,
            },
          },
        },
        ...moveLabwareOffDeck,
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
