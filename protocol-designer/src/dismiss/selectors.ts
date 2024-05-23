import mapValues from 'lodash/mapValues'
import { createSelector } from 'reselect'
import { selectors as stepFormSelectors } from '../step-forms'
import type { FormWarning } from '../steplist'
import type { BaseState, Selector } from '../types'
import type { RootState, WarningType } from './reducers'

export const rootSelector = (state: BaseState): RootState => state.dismiss
export const getAllDismissedWarnings: Selector<any> = createSelector(
  rootSelector,
  s => s.dismissedWarnings
)
export const getDismissedFormWarningTypesPerStep: Selector<
  WarningType[]
> = createSelector(getAllDismissedWarnings, all => all.form)
export const getDismissedTimelineWarningTypes: Selector<
  WarningType[]
> = createSelector(getAllDismissedWarnings, all => all.timeline)
export const getDismissedFormWarningTypesForSelectedStep: Selector<
  WarningType[]
> = createSelector(
  getDismissedFormWarningTypesPerStep,
  dismissedWarnings => dismissedWarnings
)

/** Non-dismissed form-level warnings for selected step */
export const getFormWarningsForSelectedStep: Selector<
  FormWarning[]
> = createSelector(
  stepFormSelectors.getFormLevelWarningsForUnsavedForm,
  getDismissedFormWarningTypesForSelectedStep,
  (warnings, dismissedWarnings) => {
    const formWarnings = warnings.filter(
      w => !dismissedWarnings.includes(w.type)
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
          w => !dismissedPerStep.includes(w.type)
        ).length > 0
    )
)
