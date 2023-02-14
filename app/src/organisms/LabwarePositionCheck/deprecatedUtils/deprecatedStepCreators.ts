import {
  getModuleType,
  RunTimeCommand,
  HEATERSHAKER_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  LoadedLabware,
  LoadedModule,
} from '@opentrons/shared-data'
import { getLabwareLocation } from '../../Devices/ProtocolRun/utils/getLabwareLocation'
import type {
  LabwarePositionCheckCreateCommand,
  DeprecatedLabwarePositionCheckStep,
  DeprecatedSection,
} from '../types'
import type {
  TCOpenLidCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  HeaterShakerCloseLatchCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type { MoveToWellCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/gantry'

const getIsLabwareOnTopOfTC = (
  modules: LoadedModule[],
  labwareId: string,
  commands: RunTimeCommand[]
): boolean => {
  const labwareLocation = getLabwareLocation(labwareId, commands)
  let moduleModel = null
  if (labwareLocation !== 'offDeck' && 'moduleId' in labwareLocation) {
    moduleModel = modules.find(module => module.id === labwareLocation.moduleId)
      ?.model
  }
  return (
    moduleModel != null &&
    getModuleType(moduleModel) === THERMOCYCLER_MODULE_TYPE
  )
}

const getIsLabwareOnTopOfHS = (
  modules: LoadedModule[],
  labwareId: string,
  commands: RunTimeCommand[]
): boolean => {
  const labwareLocation = getLabwareLocation(labwareId, commands)
  let moduleModel = null
  if (labwareLocation !== 'offDeck' && 'moduleId' in labwareLocation) {
    moduleModel = modules.find(module => module.id === labwareLocation.moduleId)
      ?.model
  }
  return (
    moduleModel != null &&
    getModuleType(moduleModel) === HEATERSHAKER_MODULE_TYPE
  )
}

export const getMoveToTiprackSteps = (
  labwareIds: string[],
  pipetteId: string,
  section: DeprecatedSection
): DeprecatedLabwarePositionCheckStep[] =>
  labwareIds.map(labwareId => {
    const commands = [
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

    return { section, commands, labwareId }
  })

export const getMoveToLabwareSteps = (
  labware: LoadedLabware[],
  modules: LoadedModule[],
  labwareIds: string[],
  pipetteId: string,
  section: DeprecatedSection,
  commands: RunTimeCommand[]
): DeprecatedLabwarePositionCheckStep[] =>
  labwareIds.map(labwareId => {
    const moveToWellCommand: MoveToWellCreateCommand = {
      commandType: 'moveToWell' as const,
      params: {
        pipetteId: pipetteId,
        labwareId: labwareId,
        wellName: 'A1',
        wellLocation: { origin: 'top' as const },
      },
    }

    const isLabwareOnTopOfTC = getIsLabwareOnTopOfTC(
      modules,
      labwareId,
      commands
    )

    const isLabwareOnTopOfHS = getIsLabwareOnTopOfHS(
      modules,
      labwareId,
      commands
    )
    // change this to a create command
    let moveToLabwareCommands: LabwarePositionCheckCreateCommand[] = []

    if (isLabwareOnTopOfTC) {
      // @ts-expect-error moduleId will exist from type narrowing
      const moduleId = getLabwareLocation(labwareId, commands).moduleId
      const openTCLidCommand: TCOpenLidCreateCommand = {
        commandType: 'thermocycler/openLid',
        params: {
          moduleId,
        },
      }
      moveToLabwareCommands = [openTCLidCommand, moveToWellCommand]
    } else if (isLabwareOnTopOfHS) {
      // @ts-expect-error moduleId will exist from type narrowing
      const moduleId = getLabwareLocation(labwareId, commands).moduleId
      const closeLatchCommand: HeaterShakerCloseLatchCreateCommand = {
        commandType: 'heaterShaker/closeLabwareLatch',
        params: {
          moduleId,
        },
      }
      const stopShakingCommand: HeaterShakerDeactivateShakerCreateCommand = {
        commandType: 'heaterShaker/deactivateShaker',
        params: {
          moduleId,
        },
      }
      moveToLabwareCommands = [
        closeLatchCommand,
        stopShakingCommand,
        moveToWellCommand,
      ]
    } else {
      moveToLabwareCommands = [moveToWellCommand]
    }

    return {
      section,
      labwareId,
      commands: moveToLabwareCommands,
    }
  })

export const getPickupTipStep = (
  tiprackId: string,
  pipetteId: string,
  section: DeprecatedSection
): DeprecatedLabwarePositionCheckStep => ({
  labwareId: tiprackId,
  section,
  commands: [
    {
      commandType: 'pickUpTip',
      params: {
        pipetteId,
        labwareId: tiprackId,
        wellName: 'A1',
      },
    },
  ],
})

export const getDropTipStep = (
  tiprackId: string,
  pipetteId: string,
  section: DeprecatedSection
): DeprecatedLabwarePositionCheckStep => ({
  labwareId: tiprackId,
  section,
  commands: [
    {
      commandType: 'dropTip',
      params: {
        pipetteId: pipetteId,
        labwareId: tiprackId,
        wellName: 'A1',
      },
    },
  ],
})
