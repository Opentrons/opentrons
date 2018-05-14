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
