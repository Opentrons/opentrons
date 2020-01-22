// @flow
import last from 'lodash/last'
import type { StepIdType, FormData } from '../../../form-types'

export function getNextDefaultMagnetAction(
  savedForms: { [StepIdType]: FormData },
  orderedStepIds: Array<StepIdType>
): ?string {
  const prevMagnetSteps = orderedStepIds
    .map(stepId => savedForms[stepId])
    .filter(form => form && form.magnetAction)

  const lastMagnetStep = last(prevMagnetSteps)

  // default the first magnet step to engage so that
  // recommended engage height can auto populate
  let nextDefaultMagnetAction: ?string = 'engage'

  if (lastMagnetStep && lastMagnetStep.magnetAction) {
    nextDefaultMagnetAction =
      lastMagnetStep.magnetAction === 'engage' ? 'disengage' : 'engage'
  }

  return nextDefaultMagnetAction
}
