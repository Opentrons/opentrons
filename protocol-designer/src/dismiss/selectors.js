// @flow
import {createSelector} from 'reselect'
// TODO: Ian 2018-07-02 split apart file-data concerns to avoid circular dependencies
// Eg, right now if you import {selectors as fileDataSelectors} from '../file-data',
// PD won't start, b/c of circular dependency when fileData/selectors/fileCreator
// imports getDismissedWarnings selector from 'dismiss/
import {timelineWarningsPerStep} from '../file-data/selectors/commands'
import {selectors as stepFormSelectors} from '../step-forms'
import {selectors as stepsSelectors} from '../ui/steps'
import type {FormWarning} from '../steplist'
import type {CommandCreatorWarning} from '../step-generation'
import type {BaseState, Selector} from '../types'
import type {RootState, DismissedWarningsAllSteps, WarningType} from './reducers'

export const rootSelector = (state: BaseState): RootState => state.dismiss

export const getAllDismissedWarnings: Selector<*> = createSelector(
  rootSelector,
  s => s.dismissedWarnings
)

export const getDismissedFormWarningTypes: Selector<DismissedWarningsAllSteps> = createSelector(
  getAllDismissedWarnings,
  all => all.form
)

export const getDismissedTimelineWarningTypes: Selector<DismissedWarningsAllSteps> = createSelector(
  getAllDismissedWarnings,
  all => all.timeline
)

type HasWarningsPerStep = {[stepId: string]: boolean}
export const getHasTimelineWarningsPerStep: Selector<HasWarningsPerStep> = createSelector(
  getDismissedTimelineWarningTypes,
  timelineWarningsPerStep,
  stepFormSelectors.getOrderedStepIds,
  (dismissedWarningTypes, warningsPerStep, orderedStepIds) => {
    return orderedStepIds.reduce(
      (stepAcc: HasWarningsPerStep, stepId) => {
        const warningTypesForStep = (warningsPerStep[stepId] || []).map(w => w.type)
        const dismissedWarningTypesForStep = new Set(dismissedWarningTypes[stepId] || [])

        const hasUndismissedWarnings = warningTypesForStep.filter(warningType =>
          !dismissedWarningTypesForStep.has(warningType)).length > 0

        return {
          ...stepAcc,
          [stepId]: hasUndismissedWarnings,
        }
      }, {})
  }
)

export const getTimelineWarningsForSelectedStep: Selector<Array<CommandCreatorWarning>> = createSelector(
  getDismissedTimelineWarningTypes,
  timelineWarningsPerStep,
  stepsSelectors.getSelectedStepId,
  (dismissedWarningTypes, warningsPerStep, stepId) => {
    if (stepId == null) return []
    return (warningsPerStep[stepId] || []).filter(warning =>
      !(dismissedWarningTypes[stepId] || []).includes(warning.type))
  }
)

export const getDismissedFormWarningTypesForSelectedStep: Selector<Array<WarningType>> = createSelector(
  getDismissedFormWarningTypes,
  stepsSelectors.getSelectedStepId,
  (dismissedWarnings, stepId) =>
    (stepId != null && dismissedWarnings[stepId]) || []
)

/** Non-dismissed form-level warnings for selected step */
export const getFormWarningsForSelectedStep: Selector<Array<FormWarning>> = createSelector(
  stepFormSelectors.getFormLevelWarningsForUnsavedForm,
  getDismissedFormWarningTypesForSelectedStep,
  (warnings, dismissedWarnings) => {
    const dismissedTypesForStep = dismissedWarnings
    const formWarnings = warnings.filter(w => !dismissedTypesForStep.includes(w.type))
    return formWarnings
  }
)
