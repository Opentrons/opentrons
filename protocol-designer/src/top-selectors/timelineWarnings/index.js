// @flow
import { createSelector } from 'reselect'
import { selectors as fileDataSelectors } from '../../file-data'
import { selectors as stepFormSelectors } from '../../step-forms'
import { getSelectedStepId } from '../../ui/steps'
import { selectors as dismissSelectors } from '../../dismiss'
import type { CommandCreatorWarning } from '../../step-generation'
import type { Selector } from '../../types'

export const getTimelineWarningsForSelectedStep: Selector<
  Array<CommandCreatorWarning>
> = createSelector(
  dismissSelectors.getDismissedTimelineWarningTypes,
  fileDataSelectors.timelineWarningsPerStep,
  getSelectedStepId,
  (dismissedWarningTypes, warningsPerStep, stepId) => {
    if (stepId == null) return []
    return (warningsPerStep[stepId] || []).filter(
      warning => !(dismissedWarningTypes[stepId] || []).includes(warning.type)
    )
  }
)

type HasWarningsPerStep = { [stepId: string]: boolean }
export const getHasTimelineWarningsPerStep: Selector<HasWarningsPerStep> = createSelector(
  dismissSelectors.getDismissedTimelineWarningTypes,
  fileDataSelectors.timelineWarningsPerStep,
  stepFormSelectors.getOrderedStepIds,
  (dismissedWarningTypes, warningsPerStep, orderedStepIds) => {
    return orderedStepIds.reduce((stepAcc: HasWarningsPerStep, stepId) => {
      const warningTypesForStep = (warningsPerStep[stepId] || []).map(
        w => w.type
      )
      const dismissedWarningTypesForStep = new Set(
        dismissedWarningTypes[stepId] || []
      )

      const hasUndismissedWarnings =
        warningTypesForStep.filter(
          warningType => !dismissedWarningTypesForStep.has(warningType)
        ).length > 0

      return {
        ...stepAcc,
        [stepId]: hasUndismissedWarnings,
      }
    }, {})
  }
)
