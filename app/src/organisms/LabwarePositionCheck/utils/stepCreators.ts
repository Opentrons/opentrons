import {
  getModuleType,
  ProtocolFile,
  RunTimeCommand,
  HEATERSHAKER_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getLabwareLocation } from '../../Devices/ProtocolRun/utils/getLabwareLocation'
import type {
  LabwarePositionCheckCreateCommand,
  LabwarePositionCheckStep,
  Section,
} from '../types'
import type {
  TCOpenLidCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  HeaterShakerCloseLatchCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type { MoveToWellCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/gantry'

const getIsLabwareOnTopOfTC = (
  modules: ProtocolFile<{}>['modules'],
  labwareId: string,
  commands: RunTimeCommand[]
): boolean => {
  const labwareLocation = getLabwareLocation(labwareId, commands)
  return (
    'moduleId' in labwareLocation &&
    getModuleType(modules[labwareLocation.moduleId].model) ===
      THERMOCYCLER_MODULE_TYPE
  )
}

const getIsLabwareOnTopOfHS = (
  modules: ProtocolFile<{}>['modules'],
  labwareId: string,
  commands: RunTimeCommand[]
): boolean => {
  const labwareLocation = getLabwareLocation(labwareId, commands)
  return (
    'moduleId' in labwareLocation &&
    getModuleType(modules[labwareLocation.moduleId].model) ===
      HEATERSHAKER_MODULE_TYPE
  )
}

export const getMoveToTiprackSteps = (
  labwareIds: string[],
  pipetteId: string,
  section: Section
): LabwarePositionCheckStep[] =>
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
  labware: ProtocolFile<{}>['labware'],
  modules: ProtocolFile<{}>['modules'],
  labwareIds: string[],
  pipetteId: string,
  section: Section,
  commands: RunTimeCommand[]
): LabwarePositionCheckStep[] =>
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
      // @ts-expect-error we know there is a moduleId key on type LabwareLocation because the labware is on top of a TC
      const moduleId = getLabwareLocation(labwareId, commands).moduleId
      const openTCLidCommand: TCOpenLidCreateCommand = {
        commandType: 'thermocycler/openLid',
        params: {
          moduleId,
        },
      }
      moveToLabwareCommands = [openTCLidCommand, moveToWellCommand]
    } else if (isLabwareOnTopOfHS) {
      // @ts-expect-error we know there is a moduleId key on type LabwareLocation because the labware is on top of a HS
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
  section: Section
): LabwarePositionCheckStep => ({
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
  section: Section
): LabwarePositionCheckStep => ({
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
