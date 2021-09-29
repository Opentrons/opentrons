import reduce from 'lodash/reduce'
import {
  FIXED_TRASH_ID,
  getIsTiprack,
  getTiprackVolume,
  JsonProtocolFile,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { FileModule } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5'
import type { LabwareToOrder, PickUpTipCommand } from '../types'

export const tipRackOrderSort = (
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

export const orderBySlot = (
  labware1: LabwareToOrder,
  labware2: LabwareToOrder
): -1 | 1 => {
  if (labware1.slot < labware2.slot) {
    return -1
  }
  return 1
}

export const getTiprackIdsInOrder = (
  labware: JsonProtocolFile['labware'],
  labwareDefinitions: Record<string, LabwareDefinition2>
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

export const getAllTipracksIdsThatPipetteUsesInOrder = (
  pipetteId: string,
  commands: Command[],
  labware: JsonProtocolFile['labware'],
  labwareDefinitions: Record<string, LabwareDefinition2>
): string[] => {
  const pickUpTipCommandsWithPipette: PickUpTipCommand[] = commands
    .filter(
      (command): command is PickUpTipCommand => command.command === 'pickUpTip'
    )
    .filter(command => command.params.pipette === pipetteId)

  const tipracksVisited = pickUpTipCommandsWithPipette.reduce<string[]>(
    (visited, command) => {
      const tiprack = command.params.labware
      return visited.includes(tiprack) ? visited : [...visited, tiprack]
    },
    []
  )

  const orderedTiprackIds = tipracksVisited
    .map<LabwareToOrder>(tiprackId => {
      // @ts-expect-error v1 protocols do not definitionIds baked into the labware
      const labwareDefId = labware[tiprackId].definitionId
      const definition = labwareDefinitions[labwareDefId]
      const slot = labware[tiprackId].slot
      return { labwareId: tiprackId, definition, slot }
    })
    .sort(tipRackOrderSort)
    .map(({ labwareId }) => labwareId)

  return orderedTiprackIds
}

export const getLabwareIdsInOrder = (
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
        const isOnTopOfModule =
          modules != null &&
          Object.keys(modules).some(
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
