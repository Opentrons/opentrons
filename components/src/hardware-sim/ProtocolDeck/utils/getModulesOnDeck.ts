import { parseInitialLoadedLabwareByAdapter, parseLabwareInfoByLiquidId } from '@opentrons/api-client'
import {
  SPAN7_8_10_11_SLOT,
  getModuleDef2,
  getLoadedLabwareDefinitionsByUri,
  getModuleType,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import type {
  CompletedProtocolAnalysis,
  LoadLabwareRunTimeCommand,
  ProtocolAnalysisOutput,
  LoadModuleRunTimeCommand,
  RunTimeCommand,
  ModuleLocation,
} from '@opentrons/shared-data'
import { getWellFillFromLabwareId } from './getWellFillFromLabwareId'
import { ModuleOnDeck } from '../../BaseDeck'

export const getModulesOnDeck = (protocolAnalysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis): ModuleOnDeck[] => {
  if (protocolAnalysis != null && 'modules' in protocolAnalysis) {
    const { commands, modules, labware, liquids } = protocolAnalysis
    const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(commands)
    const labwareByLiquidId = parseLabwareInfoByLiquidId(commands)
    return modules.reduce<ModuleOnDeck[]>((acc, module) => {
      const moduleDef = getModuleDef2(module.model)
      const nestedLabwareId = commands
        .filter(
          (command): command is LoadLabwareRunTimeCommand =>
            command.commandType === 'loadLabware'
        )
        .find(
          (command: LoadLabwareRunTimeCommand) =>
            typeof command.params.location === 'object' &&
            'moduleId' in command.params.location &&
            command.params.location.moduleId === module.id
        )?.result?.labwareId ?? null
      const nestedLabware = labware.find(
        item => nestedLabwareId != null && item.id === nestedLabwareId
      )
      const labwareDefinitionsByUri = getLoadedLabwareDefinitionsByUri(commands)
      const nestedLabwareDef =
        nestedLabware != null
          ? labwareDefinitionsByUri[nestedLabware.definitionUri]
          : null
      const moduleInitialLoadInfo = getModuleInitialLoadInfo(module.id, commands)
      let slotName = moduleInitialLoadInfo.location.slotName
      // Note: this is because PD for OT2 represents the slot the TC sits in as a made up slot. We want it to be rendered in slot 7
      if (slotName === SPAN7_8_10_11_SLOT) {
        slotName = '7'
      }

      const labwareInAdapterInMod = nestedLabwareId != null ? initialLoadedLabwareByAdapter[nestedLabwareId] : null
      //  NOTE: only rendering the labware on top most layer so
      //  either the adapter or the labware are rendered but not both
      const topLabwareDefinition = labwareInAdapterInMod?.result?.definition ?? nestedLabwareDef
      const topLabwareId = labwareInAdapterInMod?.result?.labwareId ?? nestedLabwareId
      const topLabwareDisplayName = labwareInAdapterInMod != null
        ? labwareInAdapterInMod.params.displayName?.toString() ?? null
        : nestedLabware?.displayName?.toString() ?? null
      const nestedLabwareWellFill = getWellFillFromLabwareId(
        topLabwareId ?? '',
        liquids,
        labwareByLiquidId
      )
      return [
        ...acc,
        {
          moduleModel: moduleDef.model,
          moduleLocation: { slotName },
          nestedLabwareWellFill,
          innerProps: getModuleType(moduleDef.model) === THERMOCYCLER_MODULE_TYPE ? { lidMotorState: 'open' } : {},
          nestedLabwareDef: topLabwareDefinition,
          nestedLabwareDisplayName: topLabwareDisplayName,
        }
      ]
    }, [])
  }

  return []
}


function getModuleInitialLoadInfo(
  moduleId: string,
  commands: RunTimeCommand[]
): {
  location: ModuleLocation
  protocolLoadOrder: number
} {
  const moduleLoadIndex = commands.findIndex(
    (command: RunTimeCommand): command is LoadModuleRunTimeCommand =>
      command.commandType === 'loadModule' &&
      command.result?.moduleId === moduleId
  )

  if (moduleLoadIndex === -1) {
    throw new Error(
      'expected to be able to find module location, but could not'
    )
  }

  const protocolLoadOrder = commands
    .slice(0, moduleLoadIndex)
    .reduce(
      (moduleLoadCount, command) =>
        command.commandType === 'loadModule'
          ? moduleLoadCount + 1
          : moduleLoadCount,
      0
    )

  return {
    location: (commands[moduleLoadIndex] as LoadModuleRunTimeCommand).params
      .location,
    protocolLoadOrder,
  }
}
