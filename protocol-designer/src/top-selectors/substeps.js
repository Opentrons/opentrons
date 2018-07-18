// @flow
import {createSelector} from 'reselect'

import {selectors as pipetteSelectors} from '../pipettes'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {INITIAL_DECK_SETUP_ID, selectors as steplistSelectors} from '../steplist'
import {selectors as fileDataSelectors} from '../file-data'
import {allWellContentsForSteps} from './well-contents'

import {
  generateSubsteps,
  type GetIngreds
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

  return wellContents.groupIds.map(id => ({
    id: id,
    name: ingredNames[id]
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
  (
    validatedForms,
    allPipetteData,
    allLabwareTypes,
    ingredNames,
    _allWellContentsForSteps,
    orderedSteps,
    robotStateTimeline
  ) => {
    return orderedSteps
    .filter(stepId => stepId !== INITIAL_DECK_SETUP_ID) // TODO: Ian 2018-07-18 once deck setup step isn't in orderedSteps, this filter can be removed
    .reduce((acc: AllSubsteps, stepId, timelineIndex) => {
      const robotState = robotStateTimeline.timeline[timelineIndex] &&
        robotStateTimeline.timeline[timelineIndex].robotState

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
        [stepId]: substeps
      }
    }, {})
  }
)
