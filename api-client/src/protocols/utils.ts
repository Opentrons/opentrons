// set of functions that parse details out of a protocol record and it's internals
import reduce from 'lodash/reduce'

import type {
  LabwareDefinition2,
  ModuleModel,
  PipetteName,
} from '@opentrons/shared-data'
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

export interface PipetteNamesById {
  [pipetteId: string]: { name: PipetteName }
}

export function parseInitialPipetteNamesById(
  commands: RunTimeCommand[]
): PipetteNamesById {
  const rightPipette = commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'right'
  )
  const leftPipette = commands.find(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' && command.params.mount === 'left'
  )

  const rightPipetteById =
    rightPipette != null
      ? {
          [rightPipette.result.pipetteId]: {
            name: rightPipette.params.pipetteName,
          },
        }
      : {}
  const leftPipetteById =
    leftPipette != null
      ? {
          [leftPipette.result.pipetteId]: {
            name: leftPipette.params.pipetteName,
          },
        }
      : {}
  return {
    ...rightPipetteById,
    ...leftPipetteById,
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
  [labwareId: string]: {
    definitionId: string
    displayName?: string
  }
}

export function parseInitialLoadedLabwareById(
  commands: RunTimeCommand[]
): LoadedLabwareById {
  const loadLabwareCommandsReversed = commands
    .filter(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware'
    )
    .reverse()
  return reduce<LoadLabwareRunTimeCommand, LoadedLabwareById>(
    loadLabwareCommandsReversed,
    (acc, command) => {
      const quirks = command.result.definition.parameters.quirks ?? []
      if (quirks.includes('fixedTrash')) {
        return { ...acc }
      }
      const labwareId = command.result.labwareId ?? ''
      const {
        namespace,
        version,
        parameters: { loadName },
      } = command.result.definition
      const definitionId = `${namespace}/${loadName}/${version}_id`

      return {
        ...acc,
        [labwareId]: {
          definitionId,
          displayName: command.params.displayName,
        },
      }
    },
    {}
  )
}

export interface LoadedLabwareDefinitionsById {
  [definitionId: string]: LabwareDefinition2
}
export function parseInitialLoadedLabwareDefinitionsById(
  commands: RunTimeCommand[]
): LoadedLabwareDefinitionsById {
  const labware = parseInitialLoadedLabwareById(commands)
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
      const definitionId = labware[labwareId]?.definitionId

      return {
        ...acc,
        [definitionId]: labwareDef,
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

export interface Liquid {
  liquidId: string
  displayName: string
  description: string
  displayColor: string
}

// TODO: sb 6/21/22 replace mock data with real function once liquid data is
// present in commands list
export function parseLiquidsInLoadOrder(): Liquid[] {
  return [
    {
      liquidId: '7',
      displayName: 'liquid 2',
      description: 'water',
      displayColor: '#00d781',
    },
    {
      liquidId: '123',
      displayName: 'liquid 1',
      description: 'saline',
      displayColor: '#0076ff',
    },
    {
      liquidId: '19',
      displayName: 'liquid 3',
      description: 'reagent',
      displayColor: '#ff4888',
    },
    {
      liquidId: '4',
      displayName: 'liquid 4',
      description: 'saliva',
      displayColor: '#B925FF',
    },
  ]
}

interface LabwareLiquidInfo {
  labwareId: string
  volumeByWell: { [well: string]: number }
}

export interface LabwareByLiquidId {
  [liquidId: string]: LabwareLiquidInfo[]
}

export function parseLabwareInfoByLiquidId(): LabwareByLiquidId {
  return {
    '123': [
      {
        labwareId:
          '5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/1',
        volumeByWell: { A1: 1000 },
      },
    ],
    '7': [
      {
        labwareId:
          '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
        volumeByWell: {
          A1: 100,
          B1: 100,
          C1: 100,
          D1: 100,
          A2: 100,
          B2: 100,
          C2: 100,
          D2: 100,
        },
      },
      {
        labwareId: '53d3b350-a9c0-11eb-bce6-9f1d5b9c1a1b',
        volumeByWell: {
          A1: 50,
          B1: 50,
          C1: 50,
          D1: 50,
        },
      },
    ],
    '4': [
      {
        labwareId:
          '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
        volumeByWell: {
          A3: 100,
          B3: 100,
          C3: 100,
          D3: 100,
          A4: 100,
          B4: 100,
          C4: 100,
          D4: 100,
        },
      },
    ],
    '19': [
      {
        labwareId:
          '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
        volumeByWell: {
          A5: 100,
          B5: 100,
          C5: 100,
          D5: 100,
          A6: 100,
          B6: 100,
          C6: 100,
          D6: 100,
        },
      },
    ],
  }
}
