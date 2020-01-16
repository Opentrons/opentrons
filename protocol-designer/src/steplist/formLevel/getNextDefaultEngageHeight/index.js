// @flow
import last from 'lodash/last'
import type { StepIdType, FormData } from '../../../form-types'

export function getNextDefaultEngageHeight(
  savedForms: { [StepIdType]: FormData },
  orderedStepIds: Array<StepIdType>
): ?number {
  const prevMagnetSteps = orderedStepIds
    .map(stepId => savedForms[stepId])
    .filter(form => form && form.engageHeight)

  const lastMagnetStep = last(prevMagnetSteps)

  let nextDefaultEngageHeight: number | null = null

  if (lastMagnetStep && lastMagnetStep.magnetAction) {
    nextDefaultEngageHeight = lastMagnetStep.engageHeight
      ? lastMagnetStep.engageHeight
      : null
  }

  return nextDefaultEngageHeight
}
