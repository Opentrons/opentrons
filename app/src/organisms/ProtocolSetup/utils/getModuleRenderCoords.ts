import { reduce } from 'lodash'
import {
  DeckDefinition,
  ModuleModel,
  SPAN7_8_10_11_SLOT,
} from '@opentrons/shared-data'
import { getProtocolData } from '../../../redux/protocol'

export type CoordinatesByModuleModel = Record<
  string,
  { x: number; y: number; z: number; moduleModel: ModuleModel }
>

export const getModuleRenderCoords = (
  protocolData: ReturnType<typeof getProtocolData>,
  deckDef: DeckDefinition
): CoordinatesByModuleModel => {
  if (protocolData != null && 'modules' in protocolData) {
    return reduce(
      protocolData.modules,
      (acc, module, moduleId) => {
        const moduleModel = module.model
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
              moduleModel,
            },
          }
        }
        const [x, y, z] = slotPosition
        return {
          ...acc,
          [moduleId]: { x, y, z, moduleModel },
        }
      },
      {}
    )
  }
  return {}
}
