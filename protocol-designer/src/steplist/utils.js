// @flow
import {END_STEP, type StepIdType} from './types'

export function getPrevStepId (
  orderedSteps: Array<StepIdType>,
  stepId: StepIdType | typeof END_STEP | null
): StepIdType {
  const stepIdx = orderedSteps.findIndex(idx => idx === stepId)
  const prevStepId = (stepIdx === -1)
  ? 0 // no previous step, use initial deck setup step 0
  : orderedSteps[stepIdx] - 1

  return prevStepId
}
