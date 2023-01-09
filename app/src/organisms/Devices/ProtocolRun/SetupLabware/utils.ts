import partition from 'lodash/partition'
import isEqual from 'lodash/isEqual'
import { getLabwareDisplayName, IDENTITY_VECTOR } from '@opentrons/shared-data'

import type { LoadModuleRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type { RunTimeCommand } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'
import type { GroupedLabwareSetupItems, LabwareSetupItem } from './types'

const LABWARE_ACCESS_COMMAND_TYPES = [
  'moveToWell',
  'aspirate',
  'dispense',
  'blowout',
  'pickUpTip',
  'dropTip',
  'touchTip',
]

export function getLabwareSetupItemGroups(
  commands: RunTimeCommand[]
): GroupedLabwareSetupItems {
  let beyondInitialLoadCommands = false
  const [offDeckItems, onDeckItems] = partition(
    commands.reduce<LabwareSetupItem[]>((acc, c) => {
      if (
        c.commandType === 'loadLabware' &&
        c.result.definition.metadata.displayCategory !== 'trash'
      ) {
        const { location, displayName } = c.params
        const { definition } = c.result
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
              `could not find load module command for module with id ${String(
                location.moduleId
              )}`
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
              : c.params.location,
            definition,
            moduleModel,
            moduleLocation,
            nickName,
          },
        ]
      } else if (
        !beyondInitialLoadCommands &&
        LABWARE_ACCESS_COMMAND_TYPES.includes(c.commandType) &&
        !(
          c.commandType === 'moveLabware' &&
          c.params.strategy === 'manualMoveWithoutPause'
        )
      ) {
        beyondInitialLoadCommands = true
      }

      return acc
    }, []),
    ({ initialLocation }) => initialLocation === 'offDeck'
  )
  return { onDeckItems, offDeckItems }
}

export function getLatestCurrentOffsets(
  currentOffsets: LabwareOffset[]
): LabwareOffset[] {
  const latestCurrentOffsets = currentOffsets.reduce<LabwareOffset[]>(
    (acc, offset) => {
      const previousMatchIndex = acc.findIndex(
        currentLabwareOffsets =>
          isEqual(offset.location, currentLabwareOffsets.location) &&
          isEqual(offset.definitionUri, currentLabwareOffsets.definitionUri)
      )
      if (
        previousMatchIndex >= 0 &&
        new Date(acc[previousMatchIndex].createdAt) < new Date(offset.createdAt)
      ) {
        return [
          ...acc.slice(0, previousMatchIndex),
          ...acc.slice(previousMatchIndex + 1),
          offset,
        ]
      } else {
        return [...acc, offset]
      }
    },
    []
  )

  const nonIdentityOffsets = latestCurrentOffsets.filter(
    currentOffset => !isEqual(currentOffset.vector, IDENTITY_VECTOR)
  )

  return nonIdentityOffsets
}
