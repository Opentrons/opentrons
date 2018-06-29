// @flow
import isMatch from 'lodash/isMatch'
import {createSelector} from 'reselect'
import {selectors as fileDataSelectors} from '../file-data'
import {selectors as steplistSelectors} from '../steplist'
import type {BaseState, Selector} from '../types'
import type {CommandCreatorWarning} from '../step-generation'
import type {RootState, DismissedWarningState} from './reducers'
import type {DismissInfo} from './types'

export const rootSelector = (state: BaseState): RootState => state.dismiss

const getDismissedWarnings: Selector<DismissedWarningState> = createSelector(
  rootSelector,
  s => s.dismissedWarnings
)

/** Non-dismissed warnings for selected step */
export const getWarningsForSelectedStep: Selector<Array<DismissInfo>> = createSelector(
  getDismissedWarnings,
  fileDataSelectors.warningsPerStep,
  steplistSelectors.selectedStepId,
  (dismissedWarnings, warningsPerStep, selectedStepId) => {
    // show warnings only for the selected step
    const rawWarnings = selectedStepId ? warningsPerStep[selectedStepId] : null

    // hide warnings without explicit FEATURE FLAG
    if (
      !rawWarnings ||
      !selectedStepId ||
      process.env.OT_PD_SHOW_WARNINGS !== 'true'
    ) return []

    // annotate warnings with dismissInfo and filter out any that are already dismissed
    const warnings = rawWarnings.reduce((acc: Array<DismissInfo>, warning: CommandCreatorWarning) => {
      const annotatedWarning: DismissInfo = {
        ...warning,
        stepId: selectedStepId,
        isDismissable: true
      }

      const isDismissed = dismissedWarnings.some(dismissedWarning =>
        isMatch(dismissedWarning, annotatedWarning))

      return isDismissed
        ? acc
        : [...acc, annotatedWarning]
    }, [])

    return warnings
  }
)
