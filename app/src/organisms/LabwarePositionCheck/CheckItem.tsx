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
import { getCurrentOffsetForLabwareInLocation } from '../Devices/ProtocolRun/utils/getCurrentOffsetForLabwareInLocation'
import { useChainRunCommands } from '../../resources/runs/hooks'
import { getDisplayLocation } from './utils/getDisplayLocation'

import type { LabwareOffset } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type {
  CheckLabwareStep,
  RegisterPositionAction,
  WorkingOffset,
} from './types'
import type { Jog } from '../../molecules/JogControls/types'

interface CheckItemProps extends Omit<CheckLabwareStep, 'section'> {
  section: 'CHECK_LABWARE' | 'CHECK_TIP_RACKS'
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  chainRunCommands: ReturnType<typeof useChainRunCommands>['chainRunCommands']
  setFatalError: (errorMessage: string) => void
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
    chainRunCommands,
    registerPosition,
    workingOffsets,
    proceed,
    handleJog,
    isRobotMoving,
    existingOffsets,
    setFatalError,
  } = props
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const labwareDef = getLabwareDef(labwareId, protocolData)
  const pipette = protocolData.pipettes.find(
    pipette => pipette.id === pipetteId
  )

  const pipetteMount = pipette?.mount
  const pipetteName = pipette?.pipetteName
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
        commandType: 'heaterShaker/closeLabwareLatch',
        params: { moduleId },
      },
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
  const initialPosition = workingOffsets.find(
    o =>
      o.labwareId === labwareId &&
      isEqual(o.location, location) &&
      o.initialPosition != null
  )?.initialPosition

  React.useEffect(() => {
    if (initialPosition == null && modulePrepCommands.length > 0) {
      chainRunCommands(modulePrepCommands, false)
        .then(() => {})
        .catch((e: Error) => {
          setFatalError(
            `CheckItem module prep commands failed with message: ${e?.message}`
          )
        })
    }
  }, [moduleId])

  if (pipetteName == null || labwareDef == null || pipetteMount == null)
    return null
  const pipetteZMotorAxis: 'leftZ' | 'rightZ' =
    pipetteMount === 'left' ? 'leftZ' : 'rightZ'
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

  const handleConfirmPlacement = (): void => {
    chainRunCommands(
      [
        {
          commandType: 'moveLabware' as const,
          params: {
            labwareId: labwareId,
            newLocation:
              moduleId != null ? { moduleId } : { slotName: location.slotName },
            strategy: 'manualMoveWithoutPause',
          },
        },
        ...protocolData.modules.reduce<CreateCommand[]>((acc, mod) => {
          if (getModuleType(mod.model) === HEATERSHAKER_MODULE_TYPE) {
            return [
              ...acc,
              {
                commandType: 'heaterShaker/closeLabwareLatch',
                params: { moduleId: mod.id },
              },
            ]
          }
          return acc
        }, []),
        {
          commandType: 'moveToWell' as const,
          params: {
            pipetteId: pipetteId,
            labwareId: labwareId,
            wellName: 'A1',
            wellLocation: { origin: 'top' as const },
          },
        },
        { commandType: 'savePosition', params: { pipetteId } },
      ],
      false
    )
      .then(responses => {
        const finalResponse = responses[responses.length - 1]
        if (finalResponse.data.commandType === 'savePosition') {
          const { position } = finalResponse.data?.result ?? { position: null }
          registerPosition({
            type: 'initialPosition',
            labwareId,
            location,
            position,
          })
        } else {
          setFatalError(
            `CheckItem failed to save position for initial placement.`
          )
        }
      })
      .catch((e: Error) => {
        setFatalError(
          `CheckItem failed to save position for initial placement with message: ${e.message}`
        )
      })
  }

  const handleConfirmPosition = (): void => {
    let confirmPositionCommands: CreateCommand[] = [
      {
        commandType: 'retractAxis' as const,
        params: {
          axis: pipetteZMotorAxis,
        },
      },
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
        commandType: 'retractAxis' as const,
        params: {
          axis: pipetteZMotorAxis,
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
    chainRunCommands(
      [
        { commandType: 'savePosition', params: { pipetteId } },
        ...confirmPositionCommands,
      ],
      false
    )
      .then(responses => {
        const firstResponse = responses[0]
        if (firstResponse.data.commandType === 'savePosition') {
          const { position } = firstResponse.data?.result ?? { position: null }
          registerPosition({
            type: 'finalPosition',
            labwareId,
            location,
            position,
          })
          proceed()
        } else {
          setFatalError('CheckItem failed to save final position with message')
        }
      })
      .catch((e: Error) => {
        setFatalError(
          `CheckItem failed to move from final position with message: ${e.message}`
        )
      })
  }
  const handleGoBack = (): void => {
    chainRunCommands(
      [
        ...modulePrepCommands,
        { commandType: 'home', params: {} },
        {
          commandType: 'moveLabware' as const,
          params: {
            labwareId: labwareId,
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
      ],
      false
    )
      .then(() => {
        registerPosition({
          type: 'initialPosition',
          labwareId,
          location,
          position: null,
        })
      })
      .catch((e: Error) => {
        setFatalError(`CheckItem failed to home: ${e.message}`)
      })
  }

  const existingOffset =
    getCurrentOffsetForLabwareInLocation(
      existingOffsets,
      getLabwareDefURI(labwareDef),
      location
    )?.vector ?? IDENTITY_VECTOR

  if (isRobotMoving)
    return (
      <RobotMotionLoader header={t('shared:stand_back_robot_is_in_motion')} />
    )
  return (
    <Flex flexDirection={DIRECTION_COLUMN} minHeight="29.5rem">
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
