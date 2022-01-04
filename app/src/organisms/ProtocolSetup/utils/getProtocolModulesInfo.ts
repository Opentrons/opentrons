import reduce from 'lodash/reduce'
import { SPAN7_8_10_11_SLOT, getModuleDef2 } from '@opentrons/shared-data'
import { LoadLabwareCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import { getModuleInitialLoadInfo } from './getModuleInitialLoadInfo'
import type {
  DeckDefinition,
  LabwareDefinition2,
  ModuleDefinition,
  ProtocolFile,
  ModuleModel,
} from '@opentrons/shared-data'

export interface ProtocolModuleInfo {
  moduleId: string
  x: number
  y: number
  z: number
  moduleDef: ModuleDefinition
  nestedLabwareDef: LabwareDefinition2 | null
  nestedLabwareId: string | null
  protocolLoadOrder: number
  slotName: string
}

export const getProtocolModulesInfo = (
  protocolData: ProtocolFile<{}>,
  deckDef: DeckDefinition
): ProtocolModuleInfo[] => {
  if (protocolData != null && 'modules' in protocolData) {
    return reduce<
      { [moduleId: string]: { model: ModuleModel } },
      ProtocolModuleInfo[]
    >(
      protocolData.modules,
      (acc, module, moduleId) => {
        const moduleDef = getModuleDef2(module.model)
        const nestedLabwareId =
          protocolData.commands
            .filter(
              (command): command is LoadLabwareCommand =>
                command.commandType === 'loadLabware'
            )
            .find(
              (command: LoadLabwareCommand) =>
                'moduleId' in command.params.location &&
                command.params.location.moduleId === moduleId
            )?.result?.labwareId ?? null

        const nestedLabware =
          nestedLabwareId != null ? protocolData.labware[nestedLabwareId] : null
        const nestedLabwareDef =
          nestedLabware != null
            ? protocolData.labwareDefinitions[nestedLabware.definitionId]
            : null
        const moduleInitialLoadInfo = getModuleInitialLoadInfo(
          moduleId,
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
            moduleId: moduleId,
            x: slotPosition[0] ?? 0,
            y: slotPosition[1] ?? 0,
            z: slotPosition[2] ?? 0,
            moduleDef,
            nestedLabwareDef,
            nestedLabwareId,
            protocolLoadOrder,
            slotName,
          },
        ]
      },
      []
    )
  }
  return []
}
