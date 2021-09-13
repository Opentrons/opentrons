import {
  DeckDefinition,
  getModuleDef2,
  LabwareDefinition2,
  SPAN7_8_10_11_SLOT,
} from '@opentrons/shared-data'
import { find, reduce } from 'lodash'
import { getProtocolData } from '../../../redux/protocol'

const getSlotPosition = (
  deckDef: DeckDefinition,
  slotNumber: string
): [number, number, number] => {
  let x = 0
  let y = 0
  let z = 0
  const slotPosition = deckDef.locations.orderedSlots.find(
    orderedSlot => orderedSlot.id === slotNumber
  )?.position

  if (slotPosition == null) {
    console.error(
      `expected to find a slot position for slot ${slotNumber} in ${deckDef.metadata.displayName}, but could not`
    )
  } else {
    x = slotPosition[0]
    y = slotPosition[1]
    z = slotPosition[2]
  }

  return [x, y, z]
}

const getSlotHasMatingSurfaceUnitVector = (
  deckDef: DeckDefinition,
  slotNumber: string
): boolean => {
  const matingSurfaceUnitVector = deckDef.locations.orderedSlots.find(
    orderedSlot => orderedSlot.id === slotNumber
  )?.matingSurfaceUnitVector

  return Boolean(matingSurfaceUnitVector)
}

export interface LabwareCoordinatesById {
  [labwareId: string]: {
    x: number
    y: number
    z: number
    labwareDef: LabwareDefinition2
  }
}

export const getLabwareRenderCoords = (
  protocolData: ReturnType<typeof getProtocolData>,
  deckDef: DeckDefinition
): LabwareCoordinatesById => {
  if (
    protocolData != null &&
    'labware' in protocolData &&
    'labwareDefinitions' in protocolData
  ) {
    return reduce(
      protocolData.labware,
      (acc, labware, labwareId) => {
        const labwareDefId = labware.definitionId
        const labwareDef = protocolData.labwareDefinitions[labwareDefId]
        const slot = labware.slot
        let slotPosition = [0, 0, 0]

        if ('modules' in protocolData) {
          const moduleInSlot = find(
            protocolData.modules,
            (_module, moduleId) => moduleId === slot
          )
          if (moduleInSlot) {
            const moduleDef = getModuleDef2(moduleInSlot.model)
            let slotNumber = moduleInSlot.slot
            // Note: this is because PD represents the slot the TC sits in as a made up slot. We want it to be rendered in slot 7
            if (slotNumber === SPAN7_8_10_11_SLOT) {
              slotNumber = '7'
            }
            const slotPosition = getSlotPosition(deckDef, slotNumber)

            const slotHasMatingSurfaceVector = getSlotHasMatingSurfaceUnitVector(
              deckDef,
              slotNumber
            )

            return slotHasMatingSurfaceVector
              ? {
                  ...acc,
                  [labwareId]: {
                    x: slotPosition[0] + moduleDef.labwareOffset.x,
                    y: slotPosition[1] + moduleDef.labwareOffset.y,
                    z:
                      moduleDef.labwareOffset.z != null
                        ? slotPosition[2] + moduleDef.labwareOffset.z
                        : slotPosition[2],
                    labwareDef,
                  },
                }
              : { ...acc }
          }
        }
        slotPosition = getSlotPosition(deckDef, slot)

        const slotHasMatingSurfaceVector = getSlotHasMatingSurfaceUnitVector(
          deckDef,
          slot
        )

        return slotHasMatingSurfaceVector
          ? {
              ...acc,
              [labwareId]: {
                x: slotPosition[0],
                y: slotPosition[1],
                z: slotPosition[2],
                labwareDef,
              },
            }
          : { ...acc }
      },
      {}
    )
  }
  return {}
}
