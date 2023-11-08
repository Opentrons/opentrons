import { getSlotHasMatingSurfaceUnitVector } from '@opentrons/shared-data'
import type {
  CompletedProtocolAnalysis,
  DeckDefinition,
  LabwareDefinition2,
  LoadLabwareRunTimeCommand,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

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
      `expected to find a slot position for slot ${slotName} in ${String(
        deckDef.metadata.displayName
      )}, but could not`
    )
  } else {
    x = slotPosition[0]
    y = slotPosition[1]
    z = slotPosition[2]
  }

  return [x, y, z]
}

export interface LabwareRenderInfoById {
  [labwareId: string]: {
    x: number
    y: number
    z: number
    labwareDef: LabwareDefinition2
    displayName: string | null
    slotName: string
  }
}

export const getLabwareRenderInfo = (
  protocolData: CompletedProtocolAnalysis | ProtocolAnalysisOutput,
  deckDef: DeckDefinition
): LabwareRenderInfoById =>
  protocolData.commands
    .filter(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware'
    )
    .reduce((acc, command) => {
      const labwareId = command.result?.labwareId
      const location = command.params.location
      const displayName = command.params.displayName ?? null
      const labwareDef = command.result?.definition
      if (
        location === 'offDeck' ||
        'moduleId' in location ||
        'labwareId' in location
      )
        return acc
      if (labwareId == null) {
        throw new Error('expected to find labware id but could not')
      }
      if (labwareDef == null) {
        throw new Error(
          `expected to find labware def for labware id ${String(
            labwareId
          )} but could not`
        )
      }
      // TODO(bh, 2023-10-19): convert this to deck definition v4 addressableAreas
      const slotName =
        'addressableAreaName' in location
          ? location.addressableAreaName
          : location.slotName
      // TODO(bh, 2023-10-19): remove slotPosition when render info no longer relies on directly
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
              displayName,
              slotName,
            },
          }
        : { ...acc }
    }, {})
