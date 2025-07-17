import {
  coordinateTupleToVector3D,
  getAddressableAreaFromSlotId,
  getDeckSlotOriginToLabwareOrigin,
  getLabwareBackLeftBottomToOrigin,
  getPositionFromSlotId,
  getSlotHasMatingSurfaceUnitVector,
  getVectorSum,
} from '@opentrons/shared-data'

import type { RunData } from '@opentrons/api-client'
import type {
  DeckDefinition,
  LabwareDefinition,
  LabwareDefinitionsByUri,
  Vector3D,
} from '@opentrons/shared-data'

export interface RunLabwareInfo {
  /**
   * The labware origin, in deck coordinates.
   * Use this with `<LabwareRender positioningMode="passThrough">`.
   */
  labwareOrigin: Vector3D

  labwareDef: LabwareDefinition
  labwareId: string
}

export function getRunLabwareRenderInfo(
  runData: RunData,
  labwareDefs: LabwareDefinitionsByUri,
  deckDef: DeckDefinition
): RunLabwareInfo[] {
  if (runData.labware.length > 0) {
    return runData.labware.reduce<RunLabwareInfo[]>((acc, labware) => {
      const location = labware.location
      if (
        (typeof location === 'object' && 'moduleId' in location) ||
        (typeof location === 'object' && 'labwareId' in location) ||
        labware.id === 'fixedTrash'
      ) {
        return acc
      }

      const labwareDef = labwareDefs[labware.definitionUri]
      if (labwareDef == null) {
        return acc
      }

      if (location !== 'offDeck' && location !== 'systemLocation') {
        const slotName =
          'addressableAreaName' in location
            ? location.addressableAreaName
            : location.slotName

        const slotAddressableArea = getAddressableAreaFromSlotId(
          slotName,
          deckDef
        )
        if (slotAddressableArea == null) {
          return acc
        }

        const slotHasMatingSurfaceVector = getSlotHasMatingSurfaceUnitVector(
          deckDef,
          slotName
        )
        if (!slotHasMatingSurfaceVector) {
          // todo(mm, 2025-06-25): Are we using slotHasMatingSurfaceVector as an
          // approximation for "is a deck slot"? Should we use
          // `slotAddressableArea.areaType === "slot"`` instead?
          return acc
        }

        // 0,0,0 default inherited from prior code. I don't think we ever reach it in
        // practice, just keeping it to be safe.
        const slotOriginTuple = getPositionFromSlotId(slotName, deckDef) ?? [
          0,
          0,
          0,
        ]
        const slotOrigin = coordinateTupleToVector3D(slotOriginTuple)

        const slotOriginToLabwareOrigin = getDeckSlotOriginToLabwareOrigin(
          slotAddressableArea,
          labwareDef
        )
        const labwareOrigin = getVectorSum(
          slotOrigin,
          slotOriginToLabwareOrigin
        )

        return [
          ...acc,
          {
            labwareOrigin,
            labwareId: labware.id,
            labwareDef,
          },
        ]
      } else {
        // Place off-deck labware literally beyond the bounds of the deck.
        // Calling code can change the position for animated fly-ins/fly-outs.
        // It's unclear to me whether it matters exactly what position we choose here;
        // this roughly maintains prior behavior.
        const whereToPutLabwareBackLeftBottom: Vector3D = {
          x: 0,
          y: deckDef.cornerOffsetFromOrigin[1],
          z: 0,
        }

        const labwareOrigin = getVectorSum(
          whereToPutLabwareBackLeftBottom,
          getLabwareBackLeftBottomToOrigin(labwareDef)
        )

        return [
          ...acc,
          {
            labwareOrigin,
            labwareId: labware.id,
            labwareDef,
          },
        ]
      }
    }, [])
  }
  return []
}
