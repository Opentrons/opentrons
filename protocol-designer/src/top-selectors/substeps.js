// @flow
import {createSelector} from 'reselect'
import map from 'lodash/map'

import {selectors as pipetteSelectors} from '../pipettes'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../steplist'
import {selectors as fileDataSelectors} from '../file-data'
import {allWellContentsForSteps} from './well-contents'

import {
  generateSubsteps,
  type GetIngreds,
} from '../steplist/generateSubsteps' // TODO Ian 2018-04-11 move generateSubsteps closer to this substeps.js file?

import type {Selector} from '../types'
import type {StepIdType} from '../form-types'
import type {SubstepItemData} from '../steplist/types'
import type {WellContentsByLabware} from './well-contents'

const getIngredsFactory = (
  wellContentsByLabware: WellContentsByLabware,
  ingredNames: {[ingredId: string]: string}
): GetIngreds => (labware, well) => {
  const wellContents = (wellContentsByLabware &&
    wellContentsByLabware[labware] &&
    wellContentsByLabware[labware][well])

  return map(wellContents.volumeByGroupId, (groupVolume, groupId) => ({
    id: groupId,
    name: ingredNames[groupId],
    volume: groupVolume,
  })) || []
}

type AllSubsteps = {[StepIdType]: ?SubstepItemData}
export const allSubsteps: Selector<AllSubsteps> = createSelector(
  steplistSelectors.validatedForms,
  pipetteSelectors.equippedPipettes,
  labwareIngredSelectors.getLabwareTypes,
  labwareIngredSelectors.getIngredientNames,
  allWellContentsForSteps,
  steplistSelectors.orderedSteps,
  fileDataSelectors.robotStateTimeline,
  fileDataSelectors.getInitialRobotState,
  (
    validatedForms,
    allPipetteData,
    allLabwareTypes,
    ingredNames,
    _allWellContentsForSteps,
    orderedSteps,
    robotStateTimeline,
    _initialRobotState,
  ) => {
    return orderedSteps
    .reduce((acc: AllSubsteps, stepId, timelineIndex) => {
      const timeline = [{robotState: _initialRobotState}, ...robotStateTimeline.timeline]
      const robotState = timeline[timelineIndex] && timeline[timelineIndex].robotState

      const substeps = generateSubsteps(
        validatedForms[stepId],
        allPipetteData,
        (labwareId: string) => allLabwareTypes[labwareId],
        getIngredsFactory(_allWellContentsForSteps[timelineIndex], ingredNames),
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
