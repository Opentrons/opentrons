import type {
  DeckDefinition,
  LabwareDefinition2,
  ProtocolFile,
} from '@opentrons/shared-data'
import type { LoadLabwareCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

const getSlotPosition = (
  deckDef: DeckDefinition,
  slotName: string
): [number, number, number] => {
  let x = 0
  let y = 0
  let z = 0
  const slotPosition = deckDef.locations.orderedSlots.find(
    orderedSlot => orderedSlot.id === slotName
  )?.position

  if (slotPosition == null) {
    console.error(
      `expected to find a slot position for slot ${slotName} in ${deckDef.metadata.displayName}, but could not`
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
  protocolData: ProtocolFile<{}>,
  deckDef: DeckDefinition
): LabwareRenderInfoById =>
  protocolData.commands
    .filter(
      (command): command is LoadLabwareCommand =>
        command.commandType === 'loadLabware'
    )
    .reduce((acc, command) => {
      const labwareId = command.result?.labwareId
      const location = command.params.location
      const labwareDef = command.result?.definition
      if ('moduleId' in location) {
        return { ...acc }
      }
      if (labwareId == null) {
        throw new Error('expected to find labware id but could not')
      }
      if (labwareDef == null) {
        throw new Error(
          `expected to find labware def for labware id ${labwareId} but could not`
        )
      }
      const slotName = location.slotName.toString()
      const slotPosition = getSlotPosition(deckDef, slotName)

      const slotHasMatingSurfaceVector = getSlotHasMatingSurfaceUnitVector(
        deckDef,
        slotName
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
    }, {})
