import reduce from 'lodash/reduce'
import {
  getIsTiprack,
  getTiprackVolume,
  JsonProtocolFile,
  LabwareDefinition2,
  FIXED_TRASH_ID,
  getModuleType,
} from '@opentrons/shared-data'
import type { FileModule } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { LabwarePositionCheckCommand } from '../types'
import { SECTIONS } from '../constants'
import { Command } from '@opentrons/shared-data/protocol/types/schemaV5'

interface LabwareToOrder {
  definition: LabwareDefinition2
  labwareId: string
  slot: string
}

const tipRackOrderSort = (
  tiprack1: LabwareToOrder,
  tiprack2: LabwareToOrder
): -1 | 1 => {
  const tiprack1Volume = getTiprackVolume(tiprack1.definition)
  const tiprack2Volume = getTiprackVolume(tiprack2.definition)

  if (tiprack1Volume !== tiprack2Volume) {
    return tiprack1Volume > tiprack2Volume ? -1 : 1
  }
  return orderBySlot(tiprack1, tiprack2)
}

const orderBySlot = (
  labware1: LabwareToOrder,
  labware2: LabwareToOrder
): -1 | 1 => {
  if (labware1.slot < labware2.slot) {
    return -1
  }
  return 1
}

const getTiprackIdsInOrder = (
  labware: JsonProtocolFile['labware'],
  labwareDefinitions: Record<string, LabwareDefinition2>,
  modules: Record<string, FileModule>
): string[] => {
  const unorderedTipracks = reduce<typeof labware, LabwareToOrder[]>(
    labware,
    (tipracks, currentLabware, labwareId) => {
      // @ts-expect-error v1 protocols do not definitionIds baked into the labware
      const labwareDef = labwareDefinitions[currentLabware.definitionId]
      const isTiprack = getIsTiprack(labwareDef)
      if (isTiprack) {
        return [
          ...tipracks,
          {
            definition: labwareDef,
            labwareId: labwareId,
            slot: currentLabware.slot,
          },
        ]
      }
      return [...tipracks]
    },
    []
  )
  const orderedTiprackIds = unorderedTipracks
    .sort(tipRackOrderSort)
    .map(({ labwareId }) => labwareId)

  return orderedTiprackIds
}

const getLabwareIdsInOrder = (
  labware: JsonProtocolFile['labware'],
  labwareDefinitions: Record<string, LabwareDefinition2>,
  modules: Record<string, FileModule>
): string[] => {
  const unorderedLabware = reduce<typeof labware, LabwareToOrder[]>(
    labware,
    (unorderedLabware, currentLabware, labwareId) => {
      // @ts-expect-error v1 protocols do not definitionIds baked into the labware
      const labwareDef = labwareDefinitions[currentLabware.definitionId]
      const isTiprack = getIsTiprack(labwareDef)
      if (!isTiprack && labwareId !== FIXED_TRASH_ID) {
        let slot = currentLabware.slot
        const isOnTopOfModule = Object.keys(modules).some(
          moduleId => moduleId === currentLabware.slot
        )
        if (isOnTopOfModule) {
          slot = modules[slot].slot
        }
        return [
          ...unorderedLabware,
          { definition: labwareDef, labwareId: labwareId, slot: slot },
        ]
      }
      return [...unorderedLabware]
    },
    []
  )
  const orderedLabwareIds = unorderedLabware
    .sort(orderBySlot)
    .map(({ labwareId }) => labwareId)

  return orderedLabwareIds
}

const getIsLabwareOnTopOfTC = (
  modules: Record<string, FileModule>,
  labware: JsonProtocolFile['labware'],
  labwareId: string
): boolean => {
  const labwareSlot = labware[labwareId].slot
  return (
    Object.keys(modules).some(moduleId => moduleId === labwareSlot) &&
    getModuleType(modules[labwareSlot].model) === 'thermocyclerModuleType'
  )
}

export const getOnePipetteWorkflowCommands = (args: {
  primaryPipetteId: string
  labware: JsonProtocolFile['labware']
  labwareDefinitions: Record<string, LabwareDefinition2>
  modules: Record<string, FileModule>
}): LabwarePositionCheckCommand[] => {
  const { primaryPipetteId, labware, labwareDefinitions, modules } = args
  const orderedTiprackIds = getTiprackIdsInOrder(
    labware,
    labwareDefinitions,
    modules
  )

  const orderedLabwareIds = getLabwareIdsInOrder(
    labware,
    labwareDefinitions,
    modules
  )

  const moveToTiprackCommands: LabwarePositionCheckCommand[] = orderedTiprackIds.map(
    labwareId => {
      const section = SECTIONS.PRIMARY_PIPETTE_TIPRACKS
      const commands = [
        {
          command: 'moveToWell' as const,
          params: {
            pipette: primaryPipetteId,
            labware: labwareId,
            well: 'A1',
          },
        },
      ]

      return { section, commands, labwareId }
    }
  )

  const lastTiprackId = orderedTiprackIds[orderedTiprackIds.length - 1]
  const pickupTipFromLastTiprackCommand: LabwarePositionCheckCommand = {
    labwareId: lastTiprackId,
    section: SECTIONS.PRIMARY_PIPETTE_TIPRACKS,
    commands: [
      {
        command: 'pickUpTip',
        params: {
          pipette: primaryPipetteId,
          labware: lastTiprackId,
          well: 'A1',
        },
      },
    ],
  }

  const moveToRemainingLabwareCommands: LabwarePositionCheckCommand[] = orderedLabwareIds.map(
    labwareId => {
      const moveToWellCommand: Command = {
        command: 'moveToWell' as const,
        params: {
          pipette: primaryPipetteId,
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
        section: SECTIONS.CHECK_REMAINING_LABWARE_WITH_PRIMARY_PIPETTE,
        labwareId,
        commands,
      }
    }
  )

  const dropTipInLastTiprackCommand: LabwarePositionCheckCommand = {
    labwareId: lastTiprackId,
    section: SECTIONS.RETURN_TIP,
    commands: [
      {
        command: 'dropTip',
        params: {
          pipette: primaryPipetteId,
          labware: lastTiprackId,
          well: 'A1',
        },
      },
    ],
  }

  return [
    ...moveToTiprackCommands,
    pickupTipFromLastTiprackCommand,
    ...moveToRemainingLabwareCommands,
    dropTipInLastTiprackCommand,
  ]
}
