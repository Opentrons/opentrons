// @flow
import {createSelector} from 'reselect'

import {selectors as pipetteSelectors} from '../pipettes'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../steplist'
import {selectors as fileDataSelectors} from '../file-data'
import {allWellContentsForSteps} from './well-contents'

import {
  generateSubsteps
} from '../steplist/generateSubsteps' // TODO Ian 2018-04-11 move generateSubsteps closer to this substeps.js file?

import type {Selector} from '../types'
import type {StepIdType} from '../form-types'
import type {StepSubItemData} from '../steplist/types'

export const allSubsteps: Selector<{[StepIdType]: StepSubItemData | null}> = createSelector(
  steplistSelectors.validatedForms,
  pipetteSelectors.equippedPipettes,
  labwareIngredSelectors.getLabwareTypes,
  labwareIngredSelectors.getIngredientNames,
  allWellContentsForSteps,
  steplistSelectors.orderedSteps,
  fileDataSelectors.robotStateTimeline,
  generateSubsteps
)
