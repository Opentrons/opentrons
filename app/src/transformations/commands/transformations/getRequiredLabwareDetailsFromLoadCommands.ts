import { getLabwareDefURI } from '@opentrons/shared-data'

import type {
  FlexStackerFillRunTimeCommand,
  FlexStackerSetStoredLabwareRunTimeCommand,
  LabwareDefinition,
  LoadLabwareRunTimeCommand,
  LoadLidRunTimeCommand,
  LoadLidStackRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'

export interface RequiredLabwareDetails {
  labwareDef: LabwareDefinition
  quantity: number
  lidDisplayName?: string
}
type ProtocolDetailMap = Map<string, RequiredLabwareDetails>

/**
 * Returns an array of RequiredLabwareDetails objects that are required by the given commands for use in protocol details ODD and desktop.
 *
 * @param {RunTimeCommand[]} commands The protocol commands for which required labware setup items are being retrieved.
 * @returns {RequiredLabwareDetails[]} An array of required labware objects that are required by the given protocol commands.
 */

export function getRequiredLabwareDetailsFromLoadCommands(
  commands: RunTimeCommand[]
): RequiredLabwareDetails[] {
  const loadLabwareCommands =
    commands.filter((command): command is
      | LoadLabwareRunTimeCommand
      | LoadLidRunTimeCommand
      | LoadLidStackRunTimeCommand
      | FlexStackerSetStoredLabwareRunTimeCommand =>
      [
        'loadLabware',
        'loadLid',
        'loadLidStack',
        'flexStacker/setStoredLabware',
      ].includes(command.commandType)
    ) ?? []
  const labwareSetupItems = loadLabwareCommands.reduce((acc, command) => {
    if (command.commandType === 'flexStacker/setStoredLabware') {
      if (command.result == null) return acc
      const stackCount = command.result.count
      let defUri = getLabwareDefURI(command.result.primaryLabwareDefinition)
      if (command.result.lidLabwareDefinition != null) {
        defUri = `${defUri}_${getLabwareDefURI(
          command.result.lidLabwareDefinition
        )}`
      }
      if (!acc.has(defUri)) {
        acc.set(defUri, {
          labwareDef: command.result.primaryLabwareDefinition,
          lidDisplayName:
            command.result.lidLabwareDefinition != null
              ? command.result.lidLabwareDefinition.metadata.displayName
              : undefined,
          quantity: 0,
        })
      }
      acc.get(defUri).quantity += stackCount
      return acc
    } else if (command.result?.definition == null) {
      return acc
    } else if (command.commandType === 'loadLid') {
      return acc
    } else if (command.commandType === 'loadLidStack') {
      const defUri = getLabwareDefURI(command.result.definition)
      const stackCount = command.result?.labwareIds.length
      if (!acc.has(defUri)) {
        acc.set(defUri, {
          labwareDef: command.result?.definition,
          quantity: 0,
        })
      }
      acc.get(defUri).quantity += stackCount
      return acc
    } else {
      if (command.result?.definition.parameters.format === 'trash') return acc
      const lidCommand = loadLabwareCommands.find(
        (c): c is LoadLidRunTimeCommand =>
          c.commandType === 'loadLid' &&
          c.params.location !== 'offDeck' &&
          c.params.location !== 'systemLocation' &&
          'labwareId' in c.params.location &&
          c.params.location.labwareId === command.result?.labwareId
      )
      let defUri = getLabwareDefURI(command.result?.definition)
      if (lidCommand?.result?.definition != null) {
        defUri = `${defUri}_${getLabwareDefURI(lidCommand.result.definition)}`
      }

      if (!acc.has(defUri)) {
        acc.set(defUri, {
          labwareDef: command.result?.definition,
          quantity: 0,
          lidDisplayName:
            lidCommand?.result?.definition != null
              ? lidCommand.result.definition.metadata.displayName
              : undefined,
        })
      }
      acc.get(defUri).quantity++
      return acc
    }
  }, new Map()) as ProtocolDetailMap

  // add stacker fill command labware after all set stored labware since these
  // commands don't include the labware definitiions
  const setupItemsWithStackerFillAdded = commands
    .filter(
      (command): command is FlexStackerFillRunTimeCommand =>
        command.commandType === 'flexStacker/fill'
    )
    .reduce((acc, command) => {
      if (command.result == null) return acc
      const stackCount = command.result.count
      let defUri = command.result.primaryLabwareURI
      if (command.result.lidLabwareURI != null) {
        defUri = `${defUri}_${command.result.lidLabwareURI}`
      }
      if (acc.has(defUri)) {
        // @ts-expect-error acc.has not accepted as TS type narrower
        acc.get(defUri).quantity += stackCount
      }
      return acc
    }, labwareSetupItems) as ProtocolDetailMap
  return Array.from(setupItemsWithStackerFillAdded.values())
}
