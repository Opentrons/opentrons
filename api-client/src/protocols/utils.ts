// set of functions that parse details out of a protocol record and it's internals
import reduce from 'lodash/reduce'

import { COLORS } from '@opentrons/components/src/ui-style-constants'
import type {
  LabwareDefinition2,
  ModuleModel,
  PipetteName,
  Liquid,
} from '@opentrons/shared-data'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6'
import type {
  LoadLabwareRunTimeCommand,
  LoadModuleRunTimeCommand,
  LoadPipetteRunTimeCommand,
  LoadLiquidRunTimeCommand,
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

export interface PipetteNamesById {
  id: string
  pipetteName: PipetteName
}

export function parsePipetteEntity(
  commands: RunTimeCommand[]
): PipetteNamesById[] {
  const rightPipette = commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'right'
  )
  const leftPipette = commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'left'
  )

  const rightPipetteEntity =
    rightPipette != null
      ? {
          id: rightPipette.result.pipetteId,
          pipetteName: rightPipette.params.pipetteName,
        }
      : {}
  const leftPipetteEntity =
    leftPipette != null
      ? {
          id: leftPipette.result.pipetteId,
          pipetteName: leftPipette.params.pipetteName,
        }
      : {}

  if (leftPipetteEntity.id == null && rightPipetteEntity.id != null) {
    return [rightPipetteEntity]
  } else if (rightPipetteEntity.id == null && leftPipetteEntity.id != null) {
    return [leftPipetteEntity]
  } else if (rightPipetteEntity.id != null && leftPipetteEntity.id != null) {
    return [rightPipetteEntity, leftPipetteEntity]
  } else {
    return []
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

export interface ModuleModelsById {
  [moduleId: string]: { model: ModuleModel }
}

export function parseAllRequiredModuleModelsById(
  commands: RunTimeCommand[]
): ModuleModelsById {
  return commands.reduce<ModuleModelsById>(
    (acc, command) =>
      command.commandType === 'loadModule'
        ? {
            ...acc,
            [command.result?.moduleId]: { model: command.params.model },
          }
        : acc,
    {}
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

export interface LoadedLabwareEntity {
  id: string
  loadName: string
  definitionUri: string
  displayName?: string
}

export function parseInitialLoadedLabwareEntity(
  commands: RunTimeCommand[]
): LoadedLabwareEntity[] {
  const loadLabwareCommands = commands.filter(
    (command): command is LoadLabwareRunTimeCommand =>
      command.commandType === 'loadLabware'
  )
  const filterOutTrashCommands = loadLabwareCommands.filter(
    command => command.result.definition.metadata.displayCategory !== 'trash'
  )
  return filterOutTrashCommands.map(command => {
    const labwareId = command.result.labwareId ?? ''
    const {
      namespace,
      version,
      parameters: { loadName },
    } = command.result.definition
    const definitionUri = `${namespace}/${loadName}/${version}`
    return {
      id: labwareId,
      loadName,
      definitionUri,
      displayName: command.params.displayName,
    }
  })
}

export interface LoadedLabwareDefinitionsById {
  [definitionUri: string]: LabwareDefinition2
}
export function parseInitialLoadedLabwareDefinitionsById(
  commands: RunTimeCommand[]
): LoadedLabwareDefinitionsById {
  const labware = parseInitialLoadedLabwareEntity(commands)
  const loadLabwareCommandsReversed = commands
    .filter(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware'
    )
    .reverse()
  return reduce<LoadLabwareRunTimeCommand, LoadedLabwareDefinitionsById>(
    loadLabwareCommandsReversed,
    (acc, command) => {
      const quirks = command.result.definition.parameters.quirks ?? []
      if (quirks.includes('fixedTrash')) {
        return { ...acc }
      }
      const labwareDef: LabwareDefinition2 = command.result?.definition
      const labwareId = command.result?.labwareId ?? ''
      const definitionUri =
        labware.find(item => item.id === labwareId)?.definitionUri ?? ''

      return {
        ...acc,
        [definitionUri]: labwareDef,
      }
    },
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
      acc[command.params.liquidId].push({ labwareId, volumeByWell })
      return acc
    },
    {}
  )
}
