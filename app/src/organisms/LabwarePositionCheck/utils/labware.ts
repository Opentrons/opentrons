import reduce from 'lodash/reduce'
import {
  getIsTiprack,
  getTiprackVolume,
  LabwareDefinition2,
  getLabwareDefURI,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'
import { getModuleInitialLoadInfo } from '../../Devices/ProtocolRun/utils/getModuleInitialLoadInfo'
import type { PickUpTipRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/pipetting'
import type {
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV7'
import type { LabwareLocation } from '@opentrons/shared-data/protocol/types/schemaV7/command/setup'
import type { LabwareToOrder } from '../types'

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

interface Labware {
  [labwareId: string]: {
    definitionId: string
    displayName?: string
  }
}

export const getTiprackIdsInOrder = (
  labware: Labware,
  labwareDefinitions: Record<string, LabwareDefinition2>,
  commands: RunTimeCommand[]
): string[] => {
  const unorderedTipracks = reduce<typeof labware, LabwareToOrder[]>(
    labware,
    (tipracks, currentLabware, labwareId) => {
      const labwareDef = labwareDefinitions[currentLabware.definitionId]
      const isTiprack = getIsTiprack(labwareDef)
      if (isTiprack) {
        const tipRackLocations = getAllUniqLocationsForLabware(
          labwareId,
          commands
        )
        return [
          ...tipracks,
          ...tipRackLocations.map(loc => ({
            definition: labwareDef,
            labwareId: labwareId,
            slot: loc !== 'offDeck' && 'slotName' in loc ? loc.slotName : '',
          })),
        ]
      }
      return tipracks
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
  labware: ProtocolAnalysisOutput['labware']
): string[] => {
  const pickUpTipCommandsWithPipette: PickUpTipRunTimeCommand[] = commands.filter(
    (command): command is PickUpTipRunTimeCommand =>
      command.commandType === 'pickUpTip' &&
      command.params.pipetteId === pipetteId
  )

  const tipRackIdsVisited = pickUpTipCommandsWithPipette.reduce<string[]>(
    (visitedIds, command) => {
      const tipRackId = command.params.labwareId
      return visitedIds.includes(tipRackId)
        ? visitedIds
        : [...visitedIds, tipRackId]
    },
    []
  )

  const labwareDefinitions = getLabwareDefinitionsFromCommands(commands)

  const orderedTiprackIds = tipRackIdsVisited
    .reduce<LabwareToOrder[]>((acc, tipRackId) => {
      const tiprackEntity = labware.find(l => l.id === tipRackId)
      const definition = labwareDefinitions.find(
        def => getLabwareDefURI(def) === tiprackEntity?.definitionUri
      )

      const tipRackLocations = getAllUniqLocationsForLabware(
        tipRackId,
        commands
      )

      if (definition == null) {
        throw new Error(
          `could not find labware definition within protocol with uri: ${tiprackEntity?.definitionUri}`
        )
      }
      return [
        ...acc,
        ...tipRackLocations.map(loc => ({
          labwareId: tipRackId,
          definition,
          slot: loc !== 'offDeck' && 'slotName' in loc ? loc.slotName : '',
        })),
      ]
    }, [])
    .sort(tipRackOrderSort)
    .map(({ labwareId }) => labwareId)

  return orderedTiprackIds
}

export const getLabwareIdsInOrder = (
  labware: ProtocolAnalysisOutput['labware'],
  commands: RunTimeCommand[]
): string[] => {
  const labwareDefinitions = getLabwareDefinitionsFromCommands(commands)

  const unorderedLabware = labware.reduce<LabwareToOrder[]>(
    (acc, currentLabware) => {
      const labwareDef = labwareDefinitions.find(
        def => getLabwareDefURI(def) === currentLabware.definitionUri
      )
      if (labwareDef == null) {
        throw new Error(
          `could not find labware definition within protocol with uri: ${currentLabware.definitionUri}`
        )
      }
      // skip any labware that is a tip rack or trash
      const isTiprack = getIsTiprack(labwareDef)
      const isTrash = labwareDef.parameters.format === 'trash'
      if (isTiprack || isTrash) return acc

      const labwareLocations = getAllUniqLocationsForLabware(
        currentLabware.id,
        commands
      )
      return [
        ...acc,
        ...labwareLocations.reduce<LabwareToOrder[]>((innerAcc, loc) => {
          let slot = ''
          if (loc === 'offDeck') {
            slot = 'offDeck'
          } else if ('moduleId' in loc) {
            slot = getModuleInitialLoadInfo(loc.moduleId, commands).location
              .slotName
          } else {
            slot = loc.slotName
          }
          return [
            ...innerAcc,
            { definition: labwareDef, labwareId: currentLabware.id, slot },
          ]
        }, []),
      ]
    },
    []
  )
  const orderedLabwareIds = unorderedLabware
    .sort(orderBySlot)
    .map(({ labwareId }) => labwareId)

  return orderedLabwareIds
}

export function getLabwareDefinitionsFromCommands(
  commands: RunTimeCommand[]
): LabwareDefinition2[] {
  return commands.reduce<LabwareDefinition2[]>((acc, command) => {
    const isLoadingNewDef =
      command.commandType === 'loadLabware' &&
      !acc.some(
        def =>
          command.result?.definition != null &&
          getLabwareDefURI(def) === getLabwareDefURI(command.result?.definition)
      )
    return isLoadingNewDef && command.result?.definition != null
      ? [...acc, command.result?.definition]
      : acc
  }, [])
}

const TRASH_ID = 'fixedTrash'

export const getAllUniqLocationsForLabware = (
  labwareId: string,
  commands: RunTimeCommand[]
): LabwareLocation[] => {
  if (labwareId === TRASH_ID) {
    return [{ slotName: '12' }]
  }
  const labwareLocation = commands.reduce<LabwareLocation[]>(
    (acc, command: RunTimeCommand) => {
      if (
        command.commandType === 'loadLabware' &&
        command.result?.definition.parameters.format !== 'trash' &&
        command.result?.labwareId === labwareId
      ) {
        const { location } = command.params
        return [...acc, location]
      }
      return acc
    },
    []
  )

  if (labwareLocation.length === 0) {
    throw new Error(
      'expected to be able to find at least one labware location, but could not'
    )
  }

  return labwareLocation
}

export function getLabwareDef(
  labwareId: string,
  protocolData: CompletedProtocolAnalysis
): LabwareDefinition2 | undefined {
  const labwareDefUri = protocolData.labware.find(l => l.id === labwareId)
    ?.definitionUri
  const labwareDefinitions = getLabwareDefinitionsFromCommands(
    protocolData.commands
  )
  return labwareDefinitions.find(def => getLabwareDefURI(def) === labwareDefUri)
}
