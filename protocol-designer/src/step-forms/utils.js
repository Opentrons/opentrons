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

// for backwards compatibility, strip version suffix (_v1, _v1.3 etc)
// from model string, if it exists
// TODO Ian 2018-12-13: Remove this and all uses next breaking change in PD files
export const pipetteModelToName = (model: string) =>
  model.replace(/_v\d(\.|\d+)*$/, '')

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

export function getLabwareIdInSlot(
  labwareIdToSlot: { [labwareId: string]: DeckSlotId },
  slot: DeckSlotId
): ?string {
  const labwareIdsForSourceSlot = Object.entries(labwareIdToSlot)
    .filter(([id, labwareSlot]) => labwareSlot === slot)
    .map(([id, labwareSlot]) => id)
  assert(
    labwareIdsForSourceSlot.length < 2,
    `multiple labware in slot ${slot}, expected none or one`
  )
  return labwareIdsForSourceSlot[0]
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
          `no pipette spec for pipette id "${pipetteId}", name "${
            pipette.name
          }"`
        )
      }

      const pipetteEntity: PipetteEntity = {
        ...pipette,
        spec,
        tiprackLabwareDef: labwareDefs[pipette.tiprackModel],
      }
      return { ...acc, [pipetteId]: pipetteEntity }
    },
    {}
  )
}
