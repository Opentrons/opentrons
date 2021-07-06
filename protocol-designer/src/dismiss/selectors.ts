import { createSelector } from 'reselect'
import mapValues from 'lodash/mapValues'
import { selectors as stepFormSelectors } from '../step-forms'
import { getSelectedStepId } from '../ui/steps/selectors'
import { PRESAVED_STEP_ID } from '../steplist/types'
import { FormWarning } from '../steplist'
import { BaseState, Selector } from '../types'
import { RootState, DismissedWarningsAllSteps, WarningType } from './reducers'
export const rootSelector = (state: BaseState): RootState => state.dismiss
export const getAllDismissedWarnings: Selector<any> = createSelector(
  rootSelector,
  s => s.dismissedWarnings
)
export const getDismissedFormWarningTypesPerStep: Selector<DismissedWarningsAllSteps> = createSelector(
  getAllDismissedWarnings,
  all => all.form
)
export const getDismissedTimelineWarningTypes: Selector<DismissedWarningsAllSteps> = createSelector(
  getAllDismissedWarnings,
  all => all.timeline
)
export const getDismissedFormWarningTypesForSelectedStep: Selector<
  WarningType[]
> = createSelector(
  getDismissedFormWarningTypesPerStep,
  getSelectedStepId,
  (dismissedWarnings, stepId) => {
    if (stepId == null) {
      return dismissedWarnings[PRESAVED_STEP_ID] || []
    }

    return dismissedWarnings[stepId] || []
  }
)

/** Non-dismissed form-level warnings for selected step */
export const getFormWarningsForSelectedStep: Selector<
  FormWarning[]
> = createSelector(
  stepFormSelectors.getFormLevelWarningsForUnsavedForm,
  getDismissedFormWarningTypesForSelectedStep,
  (warnings, dismissedWarnings) => {
    const dismissedTypesForStep = dismissedWarnings
    const formWarnings = warnings.filter(
      w => !dismissedTypesForStep.includes(w.type)
    )
    return formWarnings
  }
)
export const getHasFormLevelWarningsPerStep: Selector<
  Record<string, boolean>
> = createSelector(
  stepFormSelectors.getFormLevelWarningsPerStep,
  getDismissedFormWarningTypesPerStep,
  (warningsPerStep, dismissedPerStep) =>
    mapValues(
      warningsPerStep,
      (warnings: FormWarning, stepId: string) =>
        (warningsPerStep[stepId] || []).filter(
          w => !(dismissedPerStep[stepId] || []).includes(w.type)
        ).length > 0
    )
)
