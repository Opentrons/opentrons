import { DeckDefinition, LabwareDefinition2 } from '@opentrons/shared-data'
import reduce from 'lodash/reduce'
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

export interface LabwareRenderInfoById {
  [labwareId: string]: {
    x: number
    y: number
    z: number
    labwareDef: LabwareDefinition2
  }
}

export const getLabwareRenderInfo = (
  protocolData: ReturnType<typeof getProtocolData>,
  deckDef: DeckDefinition
): LabwareRenderInfoById => {
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

        // skip labware on modules as they are loaded with module render info
        if ('modules' in protocolData && labware.slot in protocolData.modules) {
          return acc
        }

        const slotPosition = getSlotPosition(deckDef, labware.slot)

        const slotHasMatingSurfaceVector = getSlotHasMatingSurfaceUnitVector(
          deckDef,
          labware.slot
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
