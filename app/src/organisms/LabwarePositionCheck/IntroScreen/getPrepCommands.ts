import {
  FIXED_TRASH_ID,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6'
import type {
  SetupRunTimeCommand,
  SetupCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  TCOpenLidCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { HomeCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/gantry'
import type { DropTipCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'

type LPCPrepCommand =
  | HomeCreateCommand
  | SetupRunTimeCommand
  | DropTipCreateCommand
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
        if (command.commandType === 'loadPipette') {
          const pipetteId = command.result?.pipetteId
          const loadWithPipetteId = {
            ...command,
            params: {
              ...command.params,
              pipetteId,
            },
          }
          const dropTipToBeSafe = {
            commandType: 'dropTip' as const,
            params: {
              pipetteId: pipetteId,
              labwareId: FIXED_TRASH_ID,
              wellName: 'A1',
            },
          }
          return [...acc, loadWithPipetteId, dropTipToBeSafe]
        } else if (command.commandType === 'loadLabware') {
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
        } else if (command.commandType === 'loadModule') {
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
  const loadCommands: Array<SetupCreateCommand['commandType']> = [
    'loadLabware',
    'loadLiquid',
    'loadModule',
    'loadPipette',
  ]
  // @ts-expect-error SetupCommand is more specific than Command, but the whole point of this util :)
  return loadCommands.includes(command.commandType)
}
