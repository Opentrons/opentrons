// @flow
import {createSelector} from 'reselect'
// TODO: Ian 2018-07-02 split apart file-data concerns to avoid circular dependencies
// Eg, right now if you import {selectors as fileDataSelectors} from '../file-data',
// PD won't start, b/c of circular dependency when fileData/selectors/fileCreator
// imports getDismissedWarnings selector from 'dismiss/
import {timelineWarningsPerStep} from '../file-data/selectors/commands'

import {selectors as steplistSelectors} from '../steplist'
import type {BaseState, Selector} from '../types'
import type {RootState} from './reducers'

export const rootSelector = (state: BaseState): RootState => state.dismiss

export const getDismissedWarnings: Selector<*> = createSelector(
  rootSelector,
  s => s.dismissedWarnings
)

type WarningsPerStep = {[stepId: string | number]: Array<*>}
/** Non-dismissed warnings for each step */
export const getVisibleWarningsPerStep: Selector<WarningsPerStep> = createSelector(
  getDismissedWarnings,
  timelineWarningsPerStep,
  steplistSelectors.orderedSteps,
  (dismissedWarnings, warningsPerStep, orderedSteps) => {
    return orderedSteps.reduce(
      (stepAcc: WarningsPerStep, stepId) => {
        const warningsForCurrentStep = warningsPerStep[stepId]
        const dismissedWarningsForStep = dismissedWarnings[stepId] || []

        if (!warningsForCurrentStep) return stepAcc

        // warnings match when their `type` is the same.
        // their `message` doesn't matter.
        const visibleWarnings = warningsForCurrentStep.filter(warning =>
          dismissedWarningsForStep.every(d => d.type !== warning.type)
        )

        return {
          ...stepAcc,
          [stepId]: visibleWarnings
        }
      }, {})
  }
)

export const getVisibleWarningsForSelectedStep: Selector<Array<*>> = createSelector(
  getVisibleWarningsPerStep,
  steplistSelectors.selectedStepId,
  (warningsPerStep, stepId) =>
    (typeof stepId === 'number' && warningsPerStep[stepId]) || []
)

export const getDismissedWarningsForSelectedStep: Selector<Array<*>> = createSelector(
  getDismissedWarnings,
  steplistSelectors.selectedStepId,
  (dismissedWarnings, stepId) => (typeof stepId === 'number' && dismissedWarnings[stepId]) || []
)
