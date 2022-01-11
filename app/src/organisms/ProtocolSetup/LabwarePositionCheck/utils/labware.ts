import reduce from 'lodash/reduce'
import {
  getIsTiprack,
  getTiprackVolume,
  ProtocolFile,
  LabwareDefinition2,
  getSlotHasMatingSurfaceUnitVector,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import type { PickUpTipRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { LabwareToOrder } from '../types'
import { getLabwareLocation } from '../../utils/getLabwareLocation'
import { getModuleInitialLoadInfo } from '../../utils/getModuleInitialLoadInfo'

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
  commands: RunTimeCommand[]
): string[] => {
  const unorderedTipracks = reduce<typeof labware, LabwareToOrder[]>(
    labware,
    (tipracks, currentLabware, labwareId) => {
      const labwareDef = labwareDefinitions[currentLabware.definitionId]
      const isTiprack = getIsTiprack(labwareDef)
      if (isTiprack) {
        const labwareLocation = getLabwareLocation(labwareId, commands)
        if (!('slotName' in labwareLocation)) {
          throw new Error('expected tiprack location to be a slot')
        }

        return [
          ...tipracks,
          {
            definition: labwareDef,
            labwareId: labwareId,
            slot: labwareLocation.slotName,
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
  commands: RunTimeCommand[],
  labware: ProtocolFile<{}>['labware'],
  labwareDefinitions: Record<string, LabwareDefinition2>
): string[] => {
  const pickUpTipCommandsWithPipette: PickUpTipRunTimeCommand[] = commands
    .filter(
      (command): command is PickUpTipRunTimeCommand =>
        command.commandType === 'pickUpTip'
    )
    .filter(command => command.params.pipetteId === pipetteId)

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
      const tiprackLocation = getLabwareLocation(tiprackId, commands)
      if (!('slotName' in tiprackLocation)) {
        throw new Error('expected tiprack location to be a slot')
      }
      return {
        labwareId: tiprackId,
        definition,
        slot: tiprackLocation.slotName,
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
  commands: RunTimeCommand[]
): string[] => {
  const unorderedLabware = reduce<typeof labware, LabwareToOrder[]>(
    labware,
    (unorderedLabware, currentLabware, labwareId) => {
      const labwareDef = labwareDefinitions[currentLabware.definitionId]
      const isTiprack = getIsTiprack(labwareDef)
      const labwareLocation = getLabwareLocation(labwareId, commands)
      // skip any labware that is not a tiprack
      if (!isTiprack) {
        if ('moduleId' in labwareLocation) {
          return [
            ...unorderedLabware,
            {
              definition: labwareDef,
              labwareId: labwareId,
              slot: getModuleInitialLoadInfo(labwareLocation.moduleId, commands)
                .location.slotName,
            },
          ]
        } else {
          // if we're in a slot where we can't have labware, don't include the definition (i.e. the trash bin)
          if (
            !getSlotHasMatingSurfaceUnitVector(
              standardDeckDef as any,
              labwareLocation.slotName.toString()
            )
          ) {
            return [...unorderedLabware]
          }
        }
        return [
          ...unorderedLabware,
          {
            definition: labwareDef,
            labwareId: labwareId,
            slot: labwareLocation.slotName,
          },
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
