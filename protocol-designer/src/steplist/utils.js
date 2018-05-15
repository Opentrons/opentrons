// @flow
import {END_STEP} from './types'
import type {StepIdType} from '../form-types'

export function getPrevStepId (
  orderedSteps: Array<StepIdType>,
  stepId: StepIdType | typeof END_STEP | null
): StepIdType {
  // TODO Ian 2018-05-10 standardize StepIdType to string, number is implicitly cast to string somewhere
  const stepIdx = orderedSteps.findIndex(idx => idx === stepId || `${idx}` === stepId)
  const prevStepId = (stepIdx === -1)
  ? 0 // no previous step, use initial deck setup step 0
  : orderedSteps[stepIdx] - 1

  return prevStepId
}

/** Split an array into nested arrays when predicate fn is true */
export function splitWhen<T> (
  array: Array<T>,
  predicate: (prev: T, current: T) => mixed
): Array<Array<T>> {
  const splitIdx = array.slice(1).reduce((acc: number, val: *, prevIdx: number): number => {
    if (acc !== -1) return acc // short-circuit this reduce

    return predicate(array[prevIdx], val)
      ? prevIdx + 1
      : acc
  }, -1)

  if (splitIdx === -1) {
    // no split needed
    return [array]
  }

  return [
    array.slice(0, splitIdx),
    ...splitWhen(array.slice(splitIdx), predicate)
  ]
}
