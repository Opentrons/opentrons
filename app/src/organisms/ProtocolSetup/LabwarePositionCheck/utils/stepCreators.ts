import {
  getModuleType,
  JsonProtocolFile,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import type { FileModule } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5'
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
        command: 'moveToWell' as const,
        params: {
          pipette: pipetteId,
          labware: labwareId,
          well: 'A1',
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
      command: 'moveToWell' as const,
      params: {
        pipette: pipetteId,
        labware: labwareId,
        well: 'A1',
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
        command: 'thermocycler/openLid',
        params: {
          module: labware[labwareId].slot,
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
      command: 'pickUpTip',
      params: {
        pipette: pipetteId,
        labware: tiprackId,
        well: 'A1',
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
      command: 'dropTip',
      params: {
        pipette: pipetteId,
        labware: tiprackId,
        well: 'A1',
      },
    },
  ],
})
