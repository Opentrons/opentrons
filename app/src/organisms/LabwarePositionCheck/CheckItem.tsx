import * as React from 'react'
import isEqual from 'lodash/isEqual'
import { Trans, useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { RobotMotionLoader } from './RobotMotionLoader'
import { PrepareSpace } from './PrepareSpace'
import { JogToWell } from './JogToWell'
import {
  CreateCommand,
  FIXED_TRASH_ID,
  getIsTiprack,
  getLabwareDefURI,
  getLabwareDisplayName,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  IDENTITY_VECTOR,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getLabwareDef } from './utils/labware'
import { UnorderedList } from '../../molecules/UnorderedList'

import type { LabwareOffset } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type {
  CheckLabwareStep,
  CreateRunCommand,
  RegisterPositionAction,
  WorkingOffset,
} from './types'
import type { Jog } from '../../molecules/DeprecatedJogControls/types'
import { getCurrentOffsetForLabwareInLocation } from '../Devices/ProtocolRun/utils/getCurrentOffsetForLabwareInLocation'
import { getDisplayLocation } from './utils/getDisplayLocation'
import { chainRunCommands } from './utils/chainRunCommands'
interface CheckItemProps extends Omit<CheckLabwareStep, 'section'> {
  section: 'CHECK_LABWARE' | 'CHECK_TIP_RACKS'
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  createRunCommand: CreateRunCommand
  registerPosition: React.Dispatch<RegisterPositionAction>
  workingOffsets: WorkingOffset[]
  existingOffsets: LabwareOffset[]
  handleJog: Jog
  isRobotMoving: boolean
}
export const CheckItem = (props: CheckItemProps): JSX.Element | null => {
  const {
    labwareId,
    pipetteId,
    moduleId,
    location,
    protocolData,
    createRunCommand,
    registerPosition,
    workingOffsets,
    proceed,
    handleJog,
    isRobotMoving,
    existingOffsets,
  } = props
  const { t } = useTranslation('labware_position_check')
  const labwareDef = getLabwareDef(labwareId, protocolData)
  const pipetteName =
    protocolData.pipettes.find(p => p.id === pipetteId)?.pipetteName ?? null
  let modulePrepCommands: CreateCommand[] = []
  const moduleType =
    (moduleId != null &&
      'moduleModel' in location &&
      location.moduleModel != null &&
      getModuleType(location.moduleModel)) ??
    null
  if (moduleId != null && moduleType === THERMOCYCLER_MODULE_TYPE) {
    modulePrepCommands = [
      {
        commandType: 'thermocycler/openLid',
        params: { moduleId },
      },
    ]
  } else if (moduleId != null && moduleType === HEATERSHAKER_MODULE_TYPE) {
    modulePrepCommands = [
      {
        commandType: 'heaterShaker/deactivateShaker',
        params: { moduleId },
      },
      {
        commandType: 'heaterShaker/openLabwareLatch',
        params: { moduleId },
      },
    ]
  }

  React.useEffect(() => {
    chainRunCommands(modulePrepCommands, createRunCommand)
  }, [moduleId])

  if (pipetteName == null || labwareDef == null) return null
  const isTiprack = getIsTiprack(labwareDef)
  const displayLocation = getDisplayLocation(location, t)
  const labwareDisplayName = getLabwareDisplayName(labwareDef)
  const placeItemInstruction = isTiprack ? (
    <Trans
      t={t}
      i18nKey="place_a_full_tip_rack_in_location"
      tOptions={{ tip_rack: labwareDisplayName, location: displayLocation }}
      components={{
        bold: (
          <StyledText as="span" fontWeight={TYPOGRAPHY.fontWeightSemiBold} />
        ),
      }}
    />
  ) : (
    <Trans
      t={t}
      i18nKey="place_labware_in_location"
      tOptions={{ labware: labwareDisplayName, location: displayLocation }}
      components={{
        bold: (
          <StyledText as="span" fontWeight={TYPOGRAPHY.fontWeightSemiBold} />
        ),
      }}
    />
  )

  let confirmPlacementCommands: CreateCommand[] = [
    {
      commandType: 'moveLabware' as const,
      params: {
        labwareId: labwareId,
        newLocation:
          moduleId != null ? { moduleId } : { slotName: location.slotName },
        strategy: 'manualMoveWithoutPause',
      },
    },
    {
      commandType: 'moveToWell' as const,
      params: {
        pipetteId: pipetteId,
        labwareId: labwareId,
        wellName: 'A1',
        wellLocation: { origin: 'top' as const },
      },
    },
  ]

  if (moduleId != null && moduleType != null) {
    confirmPlacementCommands =
      moduleType === HEATERSHAKER_MODULE_TYPE
        ? [
            confirmPlacementCommands[0],
            {
              commandType: 'heaterShaker/closeLabwareLatch',
              params: { moduleId },
            },
            confirmPlacementCommands[1],
          ]
        : confirmPlacementCommands
  }

  const handleConfirmPlacement = (): void => {
    chainRunCommands(confirmPlacementCommands, createRunCommand, () => {
      createRunCommand(
        {
          command: { commandType: 'savePosition', params: { pipetteId } },
          waitUntilComplete: true,
        },
        {
          onSuccess: response => {
            const { position } = response.data.result
            registerPosition({
              type: 'initialPosition',
              labwareId,
              location,
              position,
            })
          },
        }
      )
    })
  }

  const handleConfirmPosition = (): void => {
    createRunCommand(
      {
        command: { commandType: 'savePosition', params: { pipetteId } },
        waitUntilComplete: true,
      },
      {
        onSuccess: response => {
          const { position } = response.data.result
          registerPosition({
            type: 'finalPosition',
            labwareId,
            location,
            position,
          })
          let confirmPositionCommands: CreateCommand[] = [
            {
              commandType: 'moveToWell' as const,
              params: {
                pipetteId: pipetteId,
                labwareId: FIXED_TRASH_ID,
                wellName: 'A1',
                wellLocation: { origin: 'top' as const },
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
          ]
          if (
            moduleId != null &&
            moduleType != null &&
            moduleType === HEATERSHAKER_MODULE_TYPE
          ) {
            confirmPositionCommands = [
              confirmPositionCommands[0],
              {
                commandType: 'heaterShaker/openLabwareLatch',
                params: { moduleId },
              },
              confirmPositionCommands[1],
            ]
          }
          chainRunCommands(confirmPositionCommands, createRunCommand, proceed)
        },
      }
    )
  }
  const handleGoBack = (): void => {
    chainRunCommands(
      [...modulePrepCommands, { commandType: 'home', params: {} }],
      createRunCommand,
      () => {
        registerPosition({
          type: 'initialPosition',
          labwareId,
          location,
          position: null,
        })
      }
    )
  }

  const initialPosition = workingOffsets.find(
    o =>
      o.labwareId === labwareId &&
      isEqual(o.location, location) &&
      o.initialPosition != null
  )?.initialPosition
  const existingOffset =
    getCurrentOffsetForLabwareInLocation(
      existingOffsets,
      getLabwareDefURI(labwareDef),
      location
    )?.vector ?? IDENTITY_VECTOR

  if (isRobotMoving) return <RobotMotionLoader />
  return (
    <Flex flexDirection={DIRECTION_COLUMN} minHeight="25rem">
      {initialPosition != null ? (
        <JogToWell
          header={t('check_item_in_location', {
            item: isTiprack ? t('tip_rack') : t('labware'),
            location: displayLocation,
          })}
          body={
            <StyledText as="p">
              {isTiprack
                ? t('ensure_nozzle_is_above_tip')
                : t('ensure_tip_is_above_well')}
            </StyledText>
          }
          labwareDef={labwareDef}
          pipetteName={pipetteName}
          handleConfirmPosition={handleConfirmPosition}
          handleGoBack={handleGoBack}
          handleJog={handleJog}
          initialPosition={initialPosition}
          existingOffset={existingOffset}
        />
      ) : (
        <PrepareSpace
          {...props}
          header={t('prepare_item_in_location', {
            item: isTiprack ? t('tip_rack') : t('labware'),
            location: displayLocation,
          })}
          body={
            <UnorderedList
              items={[t('clear_all_slots'), placeItemInstruction]}
            />
          }
          labwareDef={labwareDef}
          confirmPlacement={handleConfirmPlacement}
        />
      )}
    </Flex>
  )
}
