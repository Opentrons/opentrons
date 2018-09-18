// @flow
import last from 'lodash/last'
import type {StepIdType, FormData} from '../../form-types'

// TODO: Ian 2018-09-18 once we support switching pipettes mid-protocol,
// this should use pipette state in RobotState, instead of pipettes/ selectors
// (which represent initial pipette state, expected to be static across the timeline)

/** returns the last used pipette or, if no pipette has been used,
  * the 'left' pipette (or 'right' if there is no 'left' ) */
export default function getNextDefaultPipetteId (
  savedForms: {[StepIdType]: FormData},
  orderedSteps: Array<StepIdType>,
  pipetteIdsByMount: {left?: string, right?: string}
): string {
  const prevPipetteSteps = orderedSteps
    .map(stepId => savedForms[stepId])
    .filter(form => form && form.pipette)

  const lastPipetteStep = last(prevPipetteSteps)

  const nextDefaultPipette = (
    (lastPipetteStep && lastPipetteStep.pipette) ||
    pipetteIdsByMount['left'] ||
    pipetteIdsByMount['right']
  )

  if (!nextDefaultPipette) {
    console.error('Could not get next default pipette. Something went wrong.')
    return ''
  }

  return nextDefaultPipette
}
