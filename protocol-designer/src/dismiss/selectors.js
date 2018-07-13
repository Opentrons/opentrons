// @flow
import difference from 'lodash/difference'
import {createSelector} from 'reselect'
// TODO: Ian 2018-07-02 split apart file-data concerns to avoid circular dependencies
// Eg, right now if you import {selectors as fileDataSelectors} from '../file-data',
// PD won't start, b/c of circular dependency when fileData/selectors/fileCreator
// imports getDismissedWarnings selector from 'dismiss/
import {timelineWarningsPerStep} from '../file-data/selectors/commands'
import {selectors as steplistSelectors, type FormWarning} from '../steplist'
import type {StepFieldName} from '../steplist/fieldLevel'
import type {CommandCreatorWarning} from '../step-generation'
import type {BaseState, Selector} from '../types'
import type {RootState, DismissedWarningsAllSteps} from './reducers'

export const rootSelector = (state: BaseState): RootState => state.dismiss

export const getAllDismissedWarnings: Selector<*> = createSelector(
  rootSelector,
  s => s.dismissedWarnings
)

export const getDismissedFormWarnings: Selector<DismissedWarningsAllSteps<FormWarning>> = createSelector(
  getAllDismissedWarnings,
  all => all.form
)

export const getDismissedTimelineWarnings: Selector<DismissedWarningsAllSteps<CommandCreatorWarning>> = createSelector(
  getAllDismissedWarnings,
  all => all.timeline
)

export const getVisibleTimelineWarningsPerStep: Selector<DismissedWarningsAllSteps<CommandCreatorWarning>> = createSelector(
  getDismissedTimelineWarnings,
  timelineWarningsPerStep,
  steplistSelectors.orderedSteps,
  (dismissedWarnings, warningsPerStep, orderedSteps) => {
    return orderedSteps.reduce(
      (stepAcc: DismissedWarningsAllSteps<CommandCreatorWarning>, stepId) => {
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

export const getVisibleTimelineWarningsForSelectedStep: Selector<Array<CommandCreatorWarning>> = createSelector(
  getVisibleTimelineWarningsPerStep,
  steplistSelectors.selectedStepId,
  (warningsPerStep, stepId) =>
    (typeof stepId === 'number' && warningsPerStep[stepId]) || []
)

export const getDismissedFormWarningsForSelectedStep: Selector<Array<FormWarning>> = createSelector(
  getDismissedFormWarnings,
  steplistSelectors.selectedStepId,
  (dismissedWarnings, stepId) => (typeof stepId === 'number' && dismissedWarnings[stepId]) || []
)

export const makeGetVisibleFormWarningsForSelectedStep: ({
  focusedField: ?StepFieldName,
  dirtyFields: Array<StepFieldName>
}) => Selector<Array<FormWarning>> = ({focusedField, dirtyFields}) =>
  createSelector(
    steplistSelectors.formLevelWarnings,
    getDismissedFormWarningsForSelectedStep,
    (warnings, dismissedWarnings) => {
      const dismissedTypesForStep = dismissedWarnings.map(dw => dw.type)
      const visibleWarnings = warnings.filter(w => !dismissedTypesForStep.includes(w.type))

      const filteredWarnings = visibleWarnings.filter(w => (
        !w.dependentFields.includes(focusedField) &&
        difference(w.dependentFields, dirtyFields).length === 0)
      )
      return filteredWarnings
    }
  )
