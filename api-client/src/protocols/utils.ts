// set of functions that parse details out of a protocol record and it's internals
import sortedUniqBy from 'lodash/sortedUniqBy'
import keyBy from 'lodash/keyBy'
import reduce from 'lodash/reduce'

import type { PipetteName, ModuleModel } from '@opentrons/shared-data'
import type {
  ProtocolFile,
  RunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6'
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
  analysis: ProtocolFile<{}>
): PipetteNamesByMount {
  const { commands, pipettes } = analysis
  const rightPipetteId = commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'right'
  )?.result.pipetteId
  const leftPipetteId = commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'left'
  )?.result.pipetteId
  return {
    left: leftPipetteId != null ? pipettes[leftPipetteId].name : null,
    right: rightPipetteId != null ? pipettes[rightPipetteId].name : null,
  }
}

export function parseAllRequiredModuleModels(
  analysis: ProtocolFile<{}>
): ModuleModel[] {
  return Object.entries(analysis.modules).map(([_moduleId, { model }]) => model)
}

interface LoadedLabwareBySlot {
  [slotName: string]: LoadLabwareRunTimeCommand
}
export function parseInitialLoadedLabwareBySlot(
  analysis: ProtocolFile<{}>
): LoadedLabwareBySlot {
  const loadLabwareCommandsReversed = analysis.commands
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
  analysis: ProtocolFile<{}>
): LoadedLabwareByModuleId {
  const loadLabwareCommandsReversed = analysis.commands
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
  analysis: ProtocolFile<{}>
): LoadedModulesBySlot {
  const loadLabwareCommandsReversed = analysis.commands
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
