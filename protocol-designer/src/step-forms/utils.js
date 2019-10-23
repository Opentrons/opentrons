// @flow
import assert from 'assert'
import reduce from 'lodash/reduce'
import { getPipetteNameSpecs, type DeckSlotId } from '@opentrons/shared-data'
import type { LabwareDefByDefURI } from '../labware-defs'
import type {
  NormalizedPipette,
  NormalizedPipetteById,
  PipetteEntity,
  PipetteEntities,
} from './types'

export function getIdsInRange<T: string | number>(
  orderedIds: Array<T>,
  startId: T,
  endId: T
): Array<T> {
  const startIdx = orderedIds.findIndex(id => id === startId)
  const endIdx = orderedIds.findIndex(id => id === endId)
  assert(
    startIdx !== -1,
    `start step "${String(startId)}" does not exist in orderedStepIds`
  )
  assert(
    endIdx !== -1,
    `end step "${String(endId)}" does not exist in orderedStepIds`
  )
  assert(
    endIdx >= startIdx,
    `expected end index to be greater than or equal to start index, got "${startIdx}", "${endIdx}"`
  )
  return orderedIds.slice(startIdx, endIdx + 1)
}

// NOTE: deck items include labware and modules
export function getDeckItemIdInSlot(
  itemIdToSlot: { [itemId: string]: DeckSlotId },
  slot: DeckSlotId
): ?string {
  const idsForSourceSlot = Object.entries(itemIdToSlot)
    .filter(([id, labwareSlot]) => labwareSlot === slot)
    .map(([id, labwareSlot]) => id)
  assert(
    idsForSourceSlot.length < 2,
    `multiple deck items in slot ${slot}, expected none or one`
  )
  return idsForSourceSlot[0]
}

export function denormalizePipetteEntities(
  pipetteInvariantProperties: NormalizedPipetteById,
  labwareDefs: LabwareDefByDefURI
): PipetteEntities {
  return reduce(
    pipetteInvariantProperties,
    (acc: PipetteEntities, pipette: NormalizedPipette): PipetteEntities => {
      const pipetteId = pipette.id
      const spec = getPipetteNameSpecs(pipette.name)
      if (!spec) {
        throw new Error(
          `no pipette spec for pipette id "${pipetteId}", name "${pipette.name}"`
        )
      }

      const pipetteEntity: PipetteEntity = {
        ...pipette,
        spec,
        tiprackLabwareDef: labwareDefs[pipette.tiprackDefURI],
      }
      return { ...acc, [pipetteId]: pipetteEntity }
    },
    {}
  )
}
