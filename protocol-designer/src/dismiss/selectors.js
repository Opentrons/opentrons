// @flow
import isMatch from 'lodash/isMatch'
import {createSelector} from 'reselect'
import {selectors as fileDataSelectors} from '../file-data'
import {selectors as steplistSelectors} from '../steplist'
import type {BaseState, Selector} from '../types'
import type {CommandCreatorWarning} from '../step-generation'
import type {RootState, DismissedWarningState} from './reducers'

export const rootSelector = (state: BaseState): RootState => state.dismiss

const getDismissedWarnings: Selector<DismissedWarningState> = createSelector(
  rootSelector,
  s => s.dismissedWarnings
)

type WarningsPerStep = {[stepId: string | number]: Array<CommandCreatorWarning>}
/** Non-dismissed warnings for selected step */
export const getWarningsPerStep: Selector<WarningsPerStep> = createSelector(
  getDismissedWarnings,
  fileDataSelectors.warningsPerStep,
  steplistSelectors.orderedSteps,
  (dismissedWarnings, warningsPerStep, orderedSteps) => {
    // TODO: show warnings only for the selected step
    return orderedSteps.reduce(
      (stepAcc: WarningsPerStep, stepId) => {
        const warningsForStep = warningsPerStep[stepId]
        if (!warningsForStep) return stepAcc
        const result = warningsForStep.reduce(
        (warningAcc: Array<CommandCreatorWarning>, warning: CommandCreatorWarning) => {
          const dismissedWarningsForStep = dismissedWarnings[stepId]
          const isDismissed = dismissedWarningsForStep
            ? dismissedWarningsForStep.some(dismissedWarning =>
              isMatch(dismissedWarning, warning))
            : false

          return isDismissed
            ? warningAcc
            : [...warningAcc, warning]
        }, [])

        return {
          ...stepAcc,
          [stepId]: result
        }
      }, {})
  }
)

export const getWarningsForSelectedStep: Selector<Array<CommandCreatorWarning>> = createSelector(
  getWarningsPerStep,
  steplistSelectors.selectedStepId,
  (warningsPerStep, stepId) =>
    (typeof stepId === 'number' && warningsPerStep[stepId]) || []
)
