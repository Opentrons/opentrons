// @flow
import {createSelector} from 'reselect'
import last from 'lodash/last'
import steplistSelectors from '../../steplist/selectors'
import * as pipetteSelectors from '../../pipettes/selectors'
import type {Selector} from '../../types'

// TODO: Ian 2018-09-18 once we support switching pipettes mid-protocol,
// this should use pipette state in RobotState, instead of pipettes/ selectors
// (which represent initial pipette state, expected to be static across the timeline)

/** returns the last used pipette or, if no pipette has been used,
  * the 'left' pipette (or 'right' if there is no 'left' ) */
const getNextDefaultPipetteId: Selector<string> = createSelector(
  steplistSelectors.getSavedForms,
  steplistSelectors.orderedStepsSelector,
  pipetteSelectors.pipetteIdsByMount,
  (savedForms, orderedSteps, pipetteIdsByMount) => {
    const prevPipetteSteps = orderedSteps
      .map(stepId => savedForms[stepId])
      .filter(form => form.pipette)

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
)

export default getNextDefaultPipetteId
