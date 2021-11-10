import reduce from 'lodash/reduce'
import {
  FIXED_TRASH_ID,
  getIsTiprack,
  getTiprackVolume,
  ProtocolFile,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { PickUpTipCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { LabwareToOrder } from '../types'
import { getLabwareLocation } from '../../utils/getLabwareLocation'
import { getModuleLocation } from '../../utils/getModuleLocation'

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
  labware: ProtocolFile<{}>['labware'],
  labwareDefinitions: Record<string, LabwareDefinition2>,
  commands: Command[]
): string[] => {
  const unorderedTipracks = reduce<typeof labware, LabwareToOrder[]>(
    labware,
    (tipracks, currentLabware, labwareId) => {
      const labwareDef = labwareDefinitions[currentLabware.definitionId]
      const isTiprack = getIsTiprack(labwareDef)
      console.log(labwareDef, isTiprack)

      if (isTiprack) {
        return [
          ...tipracks,
          {
            definition: labwareDef,
            labwareId: labwareId,
            slot: getLabwareLocation(labwareId, commands),
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
  labware: ProtocolFile<{}>['labware'],
  labwareDefinitions: Record<string, LabwareDefinition2>
): string[] => {
  console.log(commands)
  const pickUpTipCommandsWithPipette: PickUpTipCommand[] = commands
    .filter(
      (command): command is PickUpTipCommand =>
        command.commandType === 'pickUpTip'
    )
    .filter(command => command.result?.pipetteId === pipetteId)

  console.log('pickUpTipCommandsWithPipette')
  console.log(pickUpTipCommandsWithPipette)

  const tipracksVisited = pickUpTipCommandsWithPipette.reduce<string[]>(
    (visited, command) => {
      const tiprack = command.params.labwareId
      return visited.includes(tiprack) ? visited : [...visited, tiprack]
    },
    []
  )

  const orderedTiprackIds = tipracksVisited
    .map<LabwareToOrder>(tiprackId => {
      const labwareDefId = labware[tiprackId].definitionId
      const definition = labwareDefinitions[labwareDefId]
      return {
        labwareId: tiprackId,
        definition,
        slot: getLabwareLocation(tiprackId, commands),
      }
    })
    .sort(tipRackOrderSort)
    .map(({ labwareId }) => labwareId)

  return orderedTiprackIds
}

export const getLabwareIdsInOrder = (
  labware: ProtocolFile<{}>['labware'],
  labwareDefinitions: Record<string, LabwareDefinition2>,
  modules: ProtocolFile<{}>['modules'],
  commands: Command[]
): string[] => {
  const unorderedLabware = reduce<typeof labware, LabwareToOrder[]>(
    labware,
    (unorderedLabware, currentLabware, labwareId) => {
      const labwareDef = labwareDefinitions[currentLabware.definitionId]
      const isTiprack = getIsTiprack(labwareDef)
      let slot = getLabwareLocation(labwareId, commands)
      if (!isTiprack && labwareId !== FIXED_TRASH_ID) {
        const isOnTopOfModule =
          modules != null &&
          Object.keys(modules).some(moduleId => moduleId === slot)
        // labware location is a module id, we need to look up where the module is
        const moduleId = slot
        if (isOnTopOfModule) {
          slot = getModuleLocation(moduleId, commands)
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
