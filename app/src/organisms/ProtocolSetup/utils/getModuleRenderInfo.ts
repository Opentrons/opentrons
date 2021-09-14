import find from 'lodash/find'
import reduce from 'lodash/reduce'
import {
  DeckDefinition,
  LabwareDefinition2,
  ModuleDefinition,
  SPAN7_8_10_11_SLOT,
  getModuleDef2,
} from '@opentrons/shared-data'
import { getProtocolData } from '../../../redux/protocol'
import { protocol } from 'electron'

export type ModuleRenderInfoById = {
  [moduledId: string]: {
    x: number
    y: number
    z: number
    moduleDef: ModuleDefinition
    nestedLabwareDef: LabwareDefinition2 | null
  }
}

export const getModuleRenderInfo = (
  protocolData: ReturnType<typeof getProtocolData>,
  deckDef: DeckDefinition
): ModuleRenderInfoById => {
  if (protocolData != null && 'modules' in protocolData) {
    return reduce(
      protocolData.modules,
      (acc, module, moduleId) => {
        const moduleDef = getModuleDef2(module.model)
        const nestedLabware = find(
          protocolData.labware,
          lw => lw.slot === moduleId
        )
        const nestedLabwareDef =
          nestedLabware != null
            ? protocolData.labwareDefinitions[nestedLabware.definitionId]
            : null
        let slotNumber = module.slot
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
            },
          }
        }
        const [x, y, z] = slotPosition
        return {
          ...acc,
          [moduleId]: { x, y, z, moduleDef, nestedLabwareDef },
        }
      },
      {}
    )
  }
  return {}
}
