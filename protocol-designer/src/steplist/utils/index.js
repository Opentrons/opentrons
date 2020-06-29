// @flow
import { mergeWhen } from './mergeWhen'
import { getOrderedWells, orderWells } from './orderWells'

export { mergeWhen, orderWells, getOrderedWells }

export type WellRatio = 'n:n' | '1:many' | 'many:1'
export function getWellRatio(sourceWells: mixed, destWells: mixed): ?WellRatio {
  if (
    !Array.isArray(sourceWells) ||
    sourceWells.length === 0 ||
    !Array.isArray(destWells) ||
    destWells.length === 0
  ) {
    return null
  }
  if (sourceWells.length === destWells.length) {
    return 'n:n'
  }
  if (sourceWells.length === 1 && destWells.length > 1) {
    return '1:many'
  }
  if (sourceWells.length > 1 && destWells.length === 1) {
    return 'many:1'
  }
  return null
}
