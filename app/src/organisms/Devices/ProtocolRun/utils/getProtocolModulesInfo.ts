import {
  SPAN7_8_10_11_SLOT,
  getModuleDef2,
  getLoadedLabwareDefinitionsByUri,
} from '@opentrons/shared-data'
import { getModuleInitialLoadInfo } from './getModuleInitialLoadInfo'
import type { LoadLabwareRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/setup'
import type {
  DeckDefinition,
  LabwareDefinition2,
  ModuleDefinition,
  ProtocolAnalysisOutput,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'

export interface ProtocolModuleInfo {
  moduleId: string
  x: number
  y: number
  z: number
  moduleDef: ModuleDefinition
  nestedLabwareDef: LabwareDefinition2 | null
  nestedLabwareDisplayName: string | null
  nestedLabwareId: string | null
  protocolLoadOrder: number
  slotName: string
}

export const getProtocolModulesInfo = (
  protocolData: ProtocolAnalysisOutput | CompletedProtocolAnalysis,
  deckDef: DeckDefinition
): ProtocolModuleInfo[] => {
  if (protocolData != null && 'modules' in protocolData) {
    return protocolData.modules.reduce<ProtocolModuleInfo[]>((acc, module) => {
      const moduleDef = getModuleDef2(module.model)
      const nestedLabwareId =
        protocolData.commands
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
      const nestedLabware = protocolData.labware.find(
        item => nestedLabwareId != null && item.id === nestedLabwareId
      )
      const labwareDefinitionsByUri = getLoadedLabwareDefinitionsByUri(
        protocolData.commands
      )

      const nestedLabwareDef =
        nestedLabware != null
          ? labwareDefinitionsByUri[nestedLabware.definitionUri]
          : null
      const nestedLabwareDisplayName =
        nestedLabware?.displayName?.toString() ?? null
      const moduleInitialLoadInfo = getModuleInitialLoadInfo(
        module.id,
        protocolData.commands
      )
      let slotName = moduleInitialLoadInfo.location.slotName
      const { protocolLoadOrder } = moduleInitialLoadInfo
      // Note: this is because PD represents the slot the TC sits in as a made up slot. We want it to be rendered in slot 7
      if (slotName === SPAN7_8_10_11_SLOT) {
        slotName = '7'
      }
      const slotPosition =
        deckDef.locations.orderedSlots.find(slot => slot.id === slotName)
          ?.position ?? []
      if (slotPosition.length === 0) {
        console.warn(
          `expected to find a slot position for slot ${slotName} in the standard OT-2 deck definition, but could not`
        )
      }
      return [
        ...acc,
        {
          moduleId: module.id,
          x: slotPosition[0] ?? 0,
          y: slotPosition[1] ?? 0,
          z: slotPosition[2] ?? 0,
          moduleDef,
          nestedLabwareDef,
          nestedLabwareDisplayName,
          nestedLabwareId,
          protocolLoadOrder,
          slotName,
        },
      ]
    }, [])
  }
  return []
}
