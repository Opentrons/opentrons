// @flow
import {createSelector} from 'reselect'
import mapValues from 'lodash/mapValues'

import {equippedPipettes} from '../file-data/selectors/pipettes'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../steplist'
import {namedIngredsByLabware} from './well-contents'

import {
  generateSubsteps
} from '../steplist/generateSubsteps' // TODO Ian 2018-04-11 move generateSubsteps closer to this substeps.js file?

import type {Selector} from '../types'
import type {LabwareData} from '../step-generation/types'
import type {StepIdType} from '../form-types'
import type {StepSubItemData} from '../steplist/types'

export const allSubsteps: Selector<{[StepIdType]: StepSubItemData | null}> = createSelector(
  steplistSelectors.validatedForms,
  equippedPipettes,
  labwareIngredSelectors.getLabware,
  namedIngredsByLabware,
  steplistSelectors.orderedSteps,
  (_validatedForms, _pipetteData, _allLabware, _namedIngredsByLabware, _orderedSteps) => {
    const allLabwareTypes: {[labwareId: string]: string} = mapValues(_allLabware, (l: LabwareData) => l.type)
    return generateSubsteps(_validatedForms, _pipetteData, allLabwareTypes, _namedIngredsByLabware, _orderedSteps)
  }
)
