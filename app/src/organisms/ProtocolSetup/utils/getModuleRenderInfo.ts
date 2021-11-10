import findKey from 'lodash/findKey'
import reduce from 'lodash/reduce'
import {
  DeckDefinition,
  LabwareDefinition2,
  ModuleDefinition,
  SPAN7_8_10_11_SLOT,
  getModuleDef2,
  ProtocolFile,
} from '@opentrons/shared-data'
import { getLabwareLocation } from './getLabwareLocation'
import { LoadLabwareCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import { getModuleLocation } from './getModuleLocation'

export interface ModuleRenderInfoById {
  [moduledId: string]: {
    x: number
    y: number
    z: number
    moduleDef: ModuleDefinition
    nestedLabwareDef: LabwareDefinition2 | null
    nestedLabwareId: string | null
  }
}

export const getModuleRenderInfo = (
  protocolData: ProtocolFile<{}>,
  deckDef: DeckDefinition
): ModuleRenderInfoById => {
  if (protocolData != null && 'modules' in protocolData) {
    return reduce(
      protocolData.modules,
      (acc, module, moduleId) => {
        const moduleDef = getModuleDef2(module.model)
        const nestedLabwareId = protocolData.commands
          .filter(
            (command): command is LoadLabwareCommand =>
              command.commandType === 'loadLabware'
          )
          .find(
            (command: LoadLabwareCommand) =>
              'moduleId' in command.params.location &&
              command.params.location.moduleId === moduleId
          )?.params.labwareId

        const nestedLabware =
          nestedLabwareId != null ? protocolData.labware[nestedLabwareId] : null
        const nestedLabwareDef =
          nestedLabware != null
            ? protocolData.labwareDefinitions[nestedLabware.definitionId]
            : null
        let slotNumber = getModuleLocation(moduleId, protocolData.commands)
        // Note: this is because PD represents the slot the TC sits in as a made up slot. We want it to be rendered in slot 7
        if (slotNumber === SPAN7_8_10_11_SLOT) {
          slotNumber = '7'
        }
        const slotPosition = deckDef.locations.orderedSlots.find(
          slot => slot.id === slotNumber
        )?.position
        if (slotPosition == null) {
          console.error(
            `expected to find a slot position for slot ${slotNumber} in the standard OT-2 deck definition, but could not`
          )
          return {
            ...acc,
            [moduleId]: {
              x: 0,
              y: 0,
              z: 0,
              moduleDef,
              nestedLabwareDef,
              nestedLabwareId,
            },
          }
        }
        const [x, y, z] = slotPosition
        return {
          ...acc,
          [moduleId]: { x, y, z, moduleDef, nestedLabwareDef, nestedLabwareId },
        }
      },
      {}
    )
  }
  return {}
}
