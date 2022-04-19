// set of functions that parse details out of a protocol record and it's internals
import reduce from 'lodash/reduce'

import type { PipetteName, ModuleModel } from '@opentrons/shared-data'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6'
import type {
  LoadLabwareRunTimeCommand,
  LoadModuleRunTimeCommand,
  LoadPipetteRunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

interface PipetteNamesByMount {
  left: PipetteName | null
  right: PipetteName | null
}
export function parseInitialPipetteNamesByMount(
  commands: RunTimeCommand[]
): PipetteNamesByMount {
  const rightPipetteName = commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'right'
  )?.params.pipetteName as PipetteName | undefined
  const leftPipetteName = commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'left'
  )?.params.pipetteName as PipetteName | undefined
  return {
    left: leftPipetteName ?? null,
    right: rightPipetteName ?? null,
  }
}

export function parseAllRequiredModuleModels(
  commands: RunTimeCommand[]
): ModuleModel[] {
  return commands.reduce<ModuleModel[]>(
    (acc, command) =>
      command.commandType === 'loadModule'
        ? [...acc, command.params.model]
        : acc,
    []
  )
}

interface LoadedLabwareBySlot {
  [slotName: string]: LoadLabwareRunTimeCommand
}
export function parseInitialLoadedLabwareBySlot(
  commands: RunTimeCommand[]
): LoadedLabwareBySlot {
  const loadLabwareCommandsReversed = commands
    .filter(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware'
    )
    .reverse()
  return reduce<LoadLabwareRunTimeCommand, LoadedLabwareBySlot>(
    loadLabwareCommandsReversed,
    (acc, command) =>
      'slotName' in command.params.location
        ? { ...acc, [command.params.location.slotName]: command }
        : acc,
    {}
  )
}

interface LoadedLabwareByModuleId {
  [moduleId: string]: LoadLabwareRunTimeCommand
}
export function parseInitialLoadedLabwareByModuleId(
  commands: RunTimeCommand[]
): LoadedLabwareByModuleId {
  const loadLabwareCommandsReversed = commands
    .filter(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware'
    )
    .reverse()
  return reduce<LoadLabwareRunTimeCommand, LoadedLabwareByModuleId>(
    loadLabwareCommandsReversed,
    (acc, command) =>
      'moduleId' in command.params.location
        ? { ...acc, [command.params.location.moduleId]: command }
        : acc,
    {}
  )
}
interface LoadedModulesBySlot {
  [slotName: string]: LoadModuleRunTimeCommand
}
export function parseInitialLoadedModulesBySlot(
  commands: RunTimeCommand[]
): LoadedModulesBySlot {
  const loadLabwareCommandsReversed = commands
    .filter(
      (command): command is LoadModuleRunTimeCommand =>
        command.commandType === 'loadModule'
    )
    .reverse()
  return reduce<LoadModuleRunTimeCommand, LoadedModulesBySlot>(
    loadLabwareCommandsReversed,
    (acc, command) =>
      'slotName' in command.params.location
        ? { ...acc, [command.params.location.slotName]: command }
        : acc,
    {}
  )
}
