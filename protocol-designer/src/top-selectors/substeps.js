// @flow
import {createSelector} from 'reselect'

import {selectors as pipetteSelectors} from '../pipettes'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../steplist'
import {selectors as fileDataSelectors} from '../file-data'

import {
  generateSubsteps,
} from '../steplist/generateSubsteps' // TODO Ian 2018-04-11 move generateSubsteps closer to this substeps.js file?

import type {Selector} from '../types'
import type {StepIdType} from '../form-types'
import type {SubstepItemData} from '../steplist/types'

type AllSubsteps = {[StepIdType]: ?SubstepItemData}
export const allSubsteps: Selector<AllSubsteps> = createSelector(
  steplistSelectors.getArgsAndErrorsByStepId,
  pipetteSelectors.getEquippedPipettes,
  labwareIngredSelectors.getLabwareTypes,
  steplistSelectors.getOrderedSteps,
  fileDataSelectors.getRobotStateTimeline,
  fileDataSelectors.getInitialRobotState,
  (
    allStepArgsAndErrors,
    allPipetteData,
    allLabwareTypes,
    orderedSteps,
    robotStateTimeline,
    _initialRobotState,
  ) => {
    const timeline = [{robotState: _initialRobotState}, ...robotStateTimeline.timeline]

    return orderedSteps.reduce((acc: AllSubsteps, stepId, timelineIndex) => {
      const robotState = timeline[timelineIndex] && timeline[timelineIndex].robotState

      const substeps = generateSubsteps(
        allStepArgsAndErrors[stepId],
        allPipetteData,
        (labwareId: string) => allLabwareTypes[labwareId],
        robotState,
        stepId
      )

      return {
        ...acc,
        [stepId]: substeps,
      }
    }, {})
  }
)
