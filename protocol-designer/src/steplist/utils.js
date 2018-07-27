// @flow
import type {StepIdType} from '../form-types'

export function getPrevStepId (
  orderedSteps: Array<StepIdType>,
  stepId: StepIdType | null
): StepIdType {
  // TODO Ian 2018-05-10 standardize StepIdType to string, number is implicitly cast to string somewhere
  const stepIdx = orderedSteps.findIndex(idx => idx === stepId || `${idx}` === stepId)
  const prevStepId = (stepIdx === -1)
  ? 0 // no previous step, use initial deck setup step 0
  : orderedSteps[stepIdx] - 1

  return prevStepId
}

/** Merge 2 adjacent elements of an array when predicate fn is true */
export function mergeWhen<T> (
  array: Array<T>,
  predicate: (current: T, next: T) => mixed,
  merge: (current: T, next: T) => T
): Array<T> {
  if (array.length <= 1) {
    return array
  }

  const result = []
  let canMerge = true

  for (let i = 0; i + 1 < array.length; i++) {
    let current = array[i]
    let next = array[i + 1]

    if (canMerge) {
      if (predicate(current, next)) {
        result.push(merge(current, next))
        canMerge = false
      } else {
        result.push(current)
      }
    } else {
      canMerge = true
    }
  }

  if (canMerge) {
    result.push(array[array.length - 1])
  }

  return result
}
