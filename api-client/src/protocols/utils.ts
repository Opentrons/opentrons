// set of functions that parse details out of a protocol record and it's internals
import reduce from 'lodash/reduce'

import { COLORS } from '@opentrons/components/src/ui-style-constants'
import type {
  LabwareDefinition2,
  ModuleModel,
  PipetteName,
  LoadedLiquid,
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

export interface LoadedLabwareById {
  id: string
  loadName: string
  definitionUri: string
  displayName?: string
}

export function parseLoadedLabwareById(
  commands: RunTimeCommand[]
): LoadedLabwareById[] {
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
  const labware = parseLoadedLabwareById(commands)
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

export interface LoadedLiquidsById {
  [liquidId: string]: {
    displayName: string
    description: string
    displayColor?: string
  }
}

// TODO(sh, 2022-09-12): This util currently accepts liquids in two different shapes, one that adheres to the V6 schema
// and the other in array form coming from ProtocolAnalysisOutput. This should be reconciled to use a single type so
// conversion of the shape is not needed in the util and the type is consistent across the board.
export function parseLiquidsInLoadOrder(
  liquids: LoadedLiquidsById | LoadedLiquid[],
  commands: RunTimeCommand[]
): LoadedLiquid[] {
  const loadLiquidCommands = commands.filter(
    (command): command is LoadLiquidRunTimeCommand =>
      command.commandType === 'loadLiquid'
  )
  const transformedLiquids = Array.isArray(liquids)
    ? liquids
    : Object.keys(liquids).map(key => {
        return { id: key, ...liquids[key] }
      })
  const loadedLiquids = transformedLiquids.map((liquid, index) => {
    return {
      ...liquid,
      displayColor:
        liquid.displayColor ??
        COLORS.liquidColors[index % COLORS.liquidColors.length],
    }
  })

  return reduce<LoadLiquidRunTimeCommand, LoadedLiquid[]>(
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
