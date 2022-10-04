import type {
  RunTimeCommand,
  CreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6'
import type {
  SetupRunTimeCommand,
  SetupCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  TCOpenLidCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type {
  HomeCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/gantry'


type LPCPrepCommand =
  | HomeCreateCommand
  | SetupRunTimeCommand
  | TCOpenLidCreateCommand
  | HeaterShakerDeactivateShakerCreateCommand
  | HeaterShakerCloseLatchCreateCommand

export function getPrepCommands(protocolCommands: RunTimeCommand[]): LPCPrepCommand[] {
  // load commands come from the protocol resource
  const loadCommands: SetupRunTimeCommand[] =
    protocolCommands.filter(isLoadCommand).map(command => {
      if (command.commandType === 'loadPipette') {
        const commandWithPipetteId = {
          ...command,
          params: {
            ...command.params,
            pipetteId: command.result?.pipetteId,
          },
        }
        return commandWithPipetteId
      }
      return command
    }) ?? []
  // TODO: move logic from command generator for TC and HS into this function
  // TC open lid commands + HS commands come from the LPC command generator
  // const TCOpenCommands = LPCCommands.filter(isTCOpenCommand) ?? []
  // const HSCommands = LPCCommands.filter(isHSCommand) ?? []
  const homeCommand: HomeCreateCommand = {
    commandType: 'home',
    params: {},
  }
  // prepCommands will be run when a user starts LPC
  return [
    ...loadCommands,
    // ...TCOpenCommands,
    // ...HSCommands,
    homeCommand,
  ]
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

function isTCOpenCommand(
  command: CreateCommand
): command is TCOpenLidCreateCommand {
  return command.commandType === 'thermocycler/openLid'
}

function isHSCommand(
  command: CreateCommand
): command is
  | HeaterShakerDeactivateShakerCreateCommand
  | HeaterShakerCloseLatchCreateCommand {
  return command.commandType === 'heaterShaker/deactivateShaker' ||
    command.commandType === 'heaterShaker/closeLabwareLatch'
}

