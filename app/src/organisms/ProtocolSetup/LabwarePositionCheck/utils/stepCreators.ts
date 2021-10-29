import { v4 as uuidv4 } from 'uuid'
import {
  getModuleType,
  JsonProtocolFile,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import type { FileModule } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { LabwarePositionCheckStep, Section } from '../types'

const getIsLabwareOnTopOfTC = (
  modules: Record<string, FileModule>,
  labware: JsonProtocolFile['labware'],
  labwareId: string
): boolean => {
  const labwareSlot = labware[labwareId].slot
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
  labware: JsonProtocolFile['labware'],
  modules: Record<string, FileModule>,
  labwareIds: string[],
  pipetteId: string,
  section: Section
): LabwarePositionCheckStep[] =>
  labwareIds.map(labwareId => {
    const moveToWellCommand: Command = {
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
      labware,
      labwareId
    )

    let commands: Command[] = []

    if (isLabwareOnTopOfTC) {
      const openTCLidCommand: Command = {
        commandType: 'thermocycler/openLid',
        id: uuidv4(),
        params: {
          moduleId: labware[labwareId].slot,
        },
      }
      commands = [openTCLidCommand, moveToWellCommand]
    } else {
      commands = [moveToWellCommand]
    }

    return {
      section,
      labwareId,
      commands,
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
