import { v4 as uuidv4 } from 'uuid'
import {
  Command,
  getModuleType,
  ProtocolFile,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getLabwareLocation } from '../../utils/getLabwareLocation'
import type {
  LabwarePositionCheckCommand,
  LabwarePositionCheckStep,
  Section,
} from '../types'
import type { TCOpenLidCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type { MoveToWellCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/gantry'


const getIsLabwareOnTopOfTC = (
  modules:  ProtocolFile<{}>['modules'],
  labwareId: string,
  commands: Command[]
): boolean => {
  const labwareSlot = getLabwareLocation(labwareId, commands)
  return (
    modules != null &&
    Object.keys(modules).some(moduleId => moduleId === labwareSlot) &&
    getModuleType(modules[labwareSlot].model) === THERMOCYCLER_MODULE_TYPE
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
        id: uuidv4(),
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
  commands: Command[]
): LabwarePositionCheckStep[] =>
  labwareIds.map(labwareId => {
    const moveToWellCommand: MoveToWellCommand = {
      commandType: 'moveToWell' as const,
      id: uuidv4(),
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

    let moveToLabwareCommands: LabwarePositionCheckCommand[] = []

    if (isLabwareOnTopOfTC) {
      const openTCLidCommand: TCOpenLidCommand = {
        commandType: 'thermocycler/openLid',
        id: uuidv4(),
        params: {
          moduleId: getLabwareLocation(labwareId, commands),
        },
      }
      moveToLabwareCommands = [openTCLidCommand, moveToWellCommand]
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
      id: uuidv4(),
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
      id: uuidv4(),
      params: {
        pipetteId: pipetteId,
        labwareId: tiprackId,
        wellName: 'A1',
      },
    },
  ],
})
