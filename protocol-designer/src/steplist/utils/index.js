// @flow
import { mergeWhen } from './mergeWhen'
import { orderWells, getOrderedWells } from './orderWells'
import type { StepIdType } from '../../form-types'

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

export const getNextNonTerminalItemStepId = (
  orderedStepIds: Array<StepIdType>,
  stepsToDelete: Array<StepIdType>
): StepIdType => {
  let highestDeletedIndex = orderedStepIds.reduce((highestIndex, val) => {
    const currentStepIndex = orderedStepIds.indexOf(val)
    return Math.max(currentStepIndex, highestIndex)
  }, 0)
  let nextStepId = orderedStepIds[highestDeletedIndex + 1]
  while (!nextStepId) {
    highestDeletedIndex -= 1
    const potentialNextStepId = orderedStepIds[highestDeletedIndex]
    if (orderedStepIds.includes(potentialNextStepId)) {
      continue
    }
    nextStepId = potentialNextStepId
  }
  return nextStepId
}
