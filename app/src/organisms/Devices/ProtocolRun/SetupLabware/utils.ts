import reduce from 'lodash/reduce'
import partition from 'lodash/partition'
import {
  getLabwareDisplayName,
  getSlotHasMatingSurfaceUnitVector,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import { orderBySlot } from '../../../LabwarePositionCheck/utils/labware'
import { getLabwareLocation } from '../utils/getLabwareLocation'
import { getModuleInitialLoadInfo } from '../utils/getModuleInitialLoadInfo'

import type {
  LabwareDefinition2,
  ProtocolFile,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { LabwareToOrder } from '../../../LabwarePositionCheck/types'
import { GroupedLabwareSetupItems, LabwareSetupItem } from './types'
import { LoadModuleRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

export const getAllLabwareAndTiprackIdsInOrder = (
  labware: ProtocolFile<{}>['labware'],
  labwareDefinitions: Record<string, LabwareDefinition2>,
  commands: RunTimeCommand[]
): string[] => {
  const unorderedLabware = reduce<typeof labware, LabwareToOrder[]>(
    labware,
    (unorderedLabware, currentLabware, labwareId) => {
      const labwareDef = labwareDefinitions[currentLabware.definitionId]
      const labwareLocation = getLabwareLocation(labwareId, commands)

      if (labwareLocation === 'offDeck') return unorderedLabware
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
      } else if (
        !getSlotHasMatingSurfaceUnitVector(
          standardDeckDef as any,
          labwareLocation.slotName.toString()
        )
      ) {
        return unorderedLabware
      }
      return [
        ...unorderedLabware,
        {
          definition: labwareDef,
          labwareId: labwareId,
          slot: labwareLocation.slotName,
        },
      ]
    },
    []
  )
  const orderedLabwareIds = unorderedLabware
    .sort(orderBySlot)
    .map(({ labwareId }) => labwareId)

  return orderedLabwareIds
}

const SETUP_COMMAND_TYPES = [
  'loadLabware',
  'loadModule',
  'loadPipette',
  'loadLiquid',
]

export function getLabwareSetupItemGroups(
  commands: RunTimeCommand[]
): GroupedLabwareSetupItems {
  let beyondInitialLoadCommands = false
  const [offDeckItems, onDeckItems] = partition(
    commands.reduce<LabwareSetupItem[]>(
      (acc, { commandType, result, params }) => {
        if (
          commandType === 'loadLabware' &&
          result.definition.metadata.displayCategory !== 'trash'
        ) {
          const { location, displayName } = params
          const { definition } = result
          let moduleModel = null
          let moduleLocation = null
          if (location !== 'offDeck' && 'moduleId' in location) {
            const loadModuleCommand = commands.find(
              (c): c is LoadModuleRunTimeCommand =>
                c.commandType === 'loadModule' &&
                c.params.moduleId === location.moduleId
            )
            if (loadModuleCommand == null) {
              console.error(
                `could not find load module command for module with id ${location.moduleId}`
              )
            } else {
              moduleModel = loadModuleCommand.params.model
              moduleLocation = loadModuleCommand.params.location
            }
          }
          // NOTE: params.displayName is the user-assigned nickName, different from labareDisplayName from def
          const nickName =
            displayName != null &&
            displayName !== getLabwareDisplayName(definition)
              ? displayName
              : null

          return [
            ...acc,
            {
              // NOTE: for the purposes of the labware setup step, anything loaded after
              // the initial load commands will be treated as "initially off deck"
              // even if technically loaded directly onto the deck later in the protocol
              initialLocation: beyondInitialLoadCommands
                ? 'offDeck'
                : params.location,
              definition,
              moduleModel,
              moduleLocation,
              nickName,
            },
          ]
        } else if (
          !beyondInitialLoadCommands &&
          !SETUP_COMMAND_TYPES.includes(commandType) &&
          !(
            commandType === 'moveLabware' &&
            params.strategy === 'manualMoveWithoutPause'
          )
        ) {
          beyondInitialLoadCommands = true
        }

        return acc
      },
      []
    ),
    ({ initialLocation }) => initialLocation === 'offDeck'
  )
  return { onDeckItems, offDeckItems }
}
