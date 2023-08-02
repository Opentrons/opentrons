// set of functions that parse details out of a protocol record and it's internals
import reduce from 'lodash/reduce'

import { COLORS } from '@opentrons/components/src/ui-style-constants'
import { getLabwareDefURI } from '@opentrons/shared-data'
import type {
  ModuleModel,
  PipetteName,
  Liquid,
  LoadedPipette,
  LoadedLabware,
  LoadedModule,
} from '@opentrons/shared-data'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7'
import type {
  LoadLabwareRunTimeCommand,
  LoadModuleRunTimeCommand,
  LoadPipetteRunTimeCommand,
  LoadLiquidRunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV7/command/setup'

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

export function parsePipetteEntity(
  commands: RunTimeCommand[]
): LoadedPipette[] {
  const pipetteEntity = []
  const rightPipetteCommand = commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'right'
  )
  const leftPipetteCommand = commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'left'
  )
  if (rightPipetteCommand != null) {
    pipetteEntity.push({
      id: rightPipetteCommand.result?.pipetteId ?? '',
      pipetteName: rightPipetteCommand.params.pipetteName,
      mount: rightPipetteCommand.params.mount,
    })
  }
  if (leftPipetteCommand != null) {
    pipetteEntity.push({
      id: leftPipetteCommand.result?.pipetteId ?? '',
      pipetteName: leftPipetteCommand.params.pipetteName,
      mount: leftPipetteCommand.params.mount,
    })
  }

  return pipetteEntity
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

// This function is only used to compile modules from commands in the case that the
// app-side protocol analysis is being referenced and stale.
// The only time this will happen is in the protocol list page, where the serialNumber
// should NOT be referenced
export function parseRequiredModulesEntity(
  commands: RunTimeCommand[]
): LoadedModule[] {
  const loadModuleCommands = commands.filter(
    (command): command is LoadModuleRunTimeCommand =>
      command.commandType === 'loadModule'
  )
  return loadModuleCommands.map(command => {
    return {
      id: command.result?.moduleId ?? '',
      model: command.params.model,
      location: command.params.location,
      serialNumber: '',
    }
  })
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
      typeof command.params.location === 'object' &&
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
      typeof command.params.location === 'object' &&
      'moduleId' in command.params.location
        ? { ...acc, [command.params.location.moduleId]: command }
        : acc,
    {}
  )
}

export function parseInitialLoadedLabwareEntity(
  commands: RunTimeCommand[]
): LoadedLabware[] {
  const loadLabwareCommands = commands.filter(
    (command): command is LoadLabwareRunTimeCommand =>
      command.commandType === 'loadLabware'
  )
  const filterOutTrashCommands = loadLabwareCommands.filter(
    command => command.result?.definition?.metadata.displayCategory !== 'trash'
  )
  return filterOutTrashCommands.map(command => {
    const definition = command.result?.definition
    return {
      id: command.result?.labwareId ?? '',
      loadName: definition?.parameters?.loadName ?? '',
      definitionUri: definition != null ? getLabwareDefURI(definition) : '',
      location: command.params.location,
      displayName: command.params.displayName,
    }
  })
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

export interface LiquidsById {
  [liquidId: string]: {
    displayName: string
    description: string
    displayColor?: string
  }
}

// NOTE: a parsed liquid only differs from an analysis liquid in that
// it will always have a displayColor
export interface ParsedLiquid extends Omit<Liquid, 'displayColor'> {
  displayColor: string
}

export function parseLiquidsInLoadOrder(
  liquids: Liquid[],
  commands: RunTimeCommand[]
): ParsedLiquid[] {
  const loadLiquidCommands = commands.filter(
    (command): command is LoadLiquidRunTimeCommand =>
      command.commandType === 'loadLiquid'
  )
  const loadedLiquids = liquids.map((liquid, index) => {
    return {
      ...liquid,
      displayColor:
        liquid.displayColor ??
        COLORS.liquidColors[index % COLORS.liquidColors.length],
    }
  })

  return reduce<LoadLiquidRunTimeCommand, ParsedLiquid[]>(
    loadLiquidCommands,
    (acc, command) => {
      const liquid = loadedLiquids.find(
        liquid => liquid.id === command.params.liquidId
      )
      if (liquid != null && !acc.some(item => item === liquid)) acc.push(liquid)
      return acc
    },
    []
  )
}

interface LabwareLiquidInfo {
  labwareId: string
  volumeByWell: { [well: string]: number }
}

export interface LabwareByLiquidId {
  [liquidId: string]: LabwareLiquidInfo[]
}

export function parseLabwareInfoByLiquidId(
  commands: RunTimeCommand[]
): LabwareByLiquidId {
  const loadLiquidCommands =
    commands.length !== 0
      ? commands.filter(
          (command): command is LoadLiquidRunTimeCommand =>
            command.commandType === 'loadLiquid'
        )
      : []

  return reduce<LoadLiquidRunTimeCommand, LabwareByLiquidId>(
    loadLiquidCommands,
    (acc, command) => {
      if (!(command.params.liquidId in acc)) {
        acc[command.params.liquidId] = []
      }
      const labwareId = command.params.labwareId
      const volumeByWell = command.params.volumeByWell
      const labwareIndex = acc[command.params.liquidId].findIndex(
        i => i.labwareId === labwareId
      )
      if (labwareIndex >= 0) {
        acc[command.params.liquidId][labwareIndex].volumeByWell = {
          ...acc[command.params.liquidId][labwareIndex].volumeByWell,
          ...volumeByWell,
        }
      } else {
        acc[command.params.liquidId].push({ labwareId, volumeByWell })
      }
      return acc
    },
    {}
  )
}
