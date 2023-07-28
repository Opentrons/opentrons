import { getSlotHasMatingSurfaceUnitVector } from '@opentrons/shared-data'

import type { RunData } from '@opentrons/api-client'
import type {
  DeckDefinition,
  LabwareDefinition2,
  LabwareDefinitionsByUri,
} from '@opentrons/shared-data'

export interface RunLabwareInfo {
  x: number
  y: number
  labwareDef: LabwareDefinition2
  labwareId: string
}

export function getCurrentRunLabwareRenderInfo(
  runData: RunData,
  labwareDefs: LabwareDefinitionsByUri,
  deckDef: DeckDefinition
): RunLabwareInfo[] {
  if (runData.labware.length > 0) {
    return runData.labware.reduce<RunLabwareInfo[]>((acc, labware) => {
      const location = labware.location
      if (
        location === 'offDeck' ||
        'moduleId' in location ||
        labware.id === 'fixedTrash'
      ) {
        return acc
      }

      const labwareDef = labwareDefs[labware.definitionUri]
      if (labwareDef == null) {
        return acc
      }
      const slotName = location.slotName
      const slotPosition =
        deckDef.locations.orderedSlots.find(slot => slot.id === slotName)
          ?.position ?? []
      const slotHasMatingSurfaceVector = getSlotHasMatingSurfaceUnitVector(
        deckDef,
        slotName
      )

      return slotHasMatingSurfaceVector
        ? [
            ...acc,
            {
              x: slotPosition[0] ?? 0,
              y: slotPosition[1] ?? 0,
              labwareId: labware.id,
              labwareDef,
            },
          ]
        : acc
    }, [])
  }
  return []
}
