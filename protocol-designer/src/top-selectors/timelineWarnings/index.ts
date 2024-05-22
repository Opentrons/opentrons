import { createSelector } from 'reselect'
import { selectors as fileDataSelectors } from '../../file-data'
import { selectors as stepFormSelectors } from '../../step-forms'
import { getSelectedStepId } from '../../ui/steps'
import { selectors as dismissSelectors } from '../../dismiss'
import type { CommandCreatorWarning } from '@opentrons/step-generation'
import type { Selector } from '../../types'
export const getTimelineWarningsForSelectedStep: Selector<
  CommandCreatorWarning[]
> = createSelector(
  dismissSelectors.getDismissedTimelineWarningTypes,
  fileDataSelectors.timelineWarningsPerStep,
  getSelectedStepId,
  (dismissedWarningTypes, warningsPerStep, stepId) => {
    if (stepId == null) return []
    return (warningsPerStep[stepId] || []).filter(
      warning => !dismissedWarningTypes.includes(warning.type)
    )
  }
)
type HasWarningsPerStep = Record<string, boolean>
export const getHasTimelineWarningsPerStep: Selector<HasWarningsPerStep> = createSelector(
  dismissSelectors.getDismissedTimelineWarningTypes,
  fileDataSelectors.timelineWarningsPerStep,
  stepFormSelectors.getOrderedStepIds,
  (dismissedWarningTypes, warningsPerStep, orderedStepIds) => {
    return orderedStepIds.reduce((stepAcc: HasWarningsPerStep, stepId) => {
      const warningTypesForStep = (warningsPerStep[stepId] || []).map(
        w => w.type
      )
      const hasUndismissedWarnings =
        warningTypesForStep.filter(
          warningType => !dismissedWarningTypes.includes(warningType)
        ).length > 0
      return { ...stepAcc, [stepId]: hasUndismissedWarnings }
    }, {})
  }
)
