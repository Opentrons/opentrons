// @flow
import assert from 'assert'

// for backwards compatibility, strip version suffix (_v1, _v1.3 etc)
// from model string, if it exists
// TODO Ian 2018-12-13: Remove this and all uses next breaking change in PD files
export const pipetteModelToName = (model: string) =>
  model.replace(/_v\d(\.|\d+)*$/, '')

export function getIdsInRange<T: string | number> (orderedIds: Array<T>, startId: T, endId: T): Array<T> {
  const startIdx = orderedIds.findIndex(id => id === startId)
  const endIdx = orderedIds.findIndex(id => id === endId)
  assert(startIdx !== -1, `start step "${String(startId)}" does not exist in orderedSteps`)
  assert(endIdx !== -1, `end step "${String(endId)}" does not exist in orderedSteps`)
  assert(endIdx >= startIdx, `expected end index to be greater than or equal to start index, got "${startIdx}", "${endIdx}"`)
  return orderedIds.slice(startIdx, endIdx + 1)
}
