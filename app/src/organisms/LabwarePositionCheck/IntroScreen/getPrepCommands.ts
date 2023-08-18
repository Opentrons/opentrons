import {
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import type {
  CreateCommand,
  RunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV7'
import type { SetupRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/setup'
import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  TCOpenLidCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV7/command/module'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { HomeCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/gantry'

type LPCPrepCommand =
  | HomeCreateCommand
  | SetupRunTimeCommand
  | TCOpenLidCreateCommand
  | HeaterShakerDeactivateShakerCreateCommand
  | HeaterShakerCloseLatchCreateCommand

export function getPrepCommands(
  protocolData: CompletedProtocolAnalysis
): LPCPrepCommand[] {
  // load commands come from the protocol resource
  const loadCommands: LPCPrepCommand[] =
    protocolData.commands
      .filter(isLoadCommand)
      .reduce<LPCPrepCommand[]>((acc, command) => {
        if (
          command.commandType === 'loadPipette' &&
          command.result?.pipetteId != null
        ) {
          const { pipetteId } = command.result
          const loadWithPipetteId = {
            ...command,
            params: {
              ...command.params,
              pipetteId,
            },
          }
          return [...acc, loadWithPipetteId]
        } else if (
          command.commandType === 'loadLabware' &&
          command.result?.labwareId != null
        ) {
          // load all labware off-deck so that LPC can move them on individually later
          return [
            ...acc,
            {
              ...command,
              params: {
                ...command.params,
                location: 'offDeck',
                // python protocols won't have labwareId in the params, we want to
                // use the same labwareIds that came back as the result of analysis
                labwareId: command.result.labwareId,
              },
            },
          ]
        } else if (
          command.commandType === 'loadModule' &&
          command.result?.moduleId != null
        ) {
          return [
            ...acc,
            {
              ...command,
              params: {
                ...command.params,
                // python protocols won't have moduleId in the params, we want to
                // use the same moduleIds that came back as the result of analysis
                moduleId: command.result.moduleId,
              },
            },
          ]
        }
        return [...acc, command]
      }, []) ?? []

  const TCCommands = protocolData.modules.reduce<TCOpenLidCreateCommand[]>(
    (acc, module) => {
      if (getModuleType(module.model) === THERMOCYCLER_MODULE_TYPE) {
        return [
          ...acc,
          {
            commandType: 'thermocycler/openLid',
            params: { moduleId: module.id },
          },
        ]
      }
      return acc
    },
    []
  )

  const HSCommands = protocolData.modules.reduce<
    HeaterShakerCloseLatchCreateCommand[]
  >((acc, module) => {
    if (getModuleType(module.model) === HEATERSHAKER_MODULE_TYPE) {
      return [
        ...acc,
        {
          commandType: 'heaterShaker/closeLabwareLatch',
          params: { moduleId: module.id },
        },
      ]
    }
    return acc
  }, [])
  const homeCommand: HomeCreateCommand = {
    commandType: 'home',
    params: {},
  }
  // prepCommands will be run when a user starts LPC
  return [...loadCommands, ...TCCommands, ...HSCommands, homeCommand]
}

function isLoadCommand(
  command: RunTimeCommand
): command is SetupRunTimeCommand {
  const loadCommands: Array<CreateCommand['commandType']> = [
    'loadLabware',
    'loadModule',
    'loadPipette',
  ]
  return loadCommands.includes(command.commandType)
}
