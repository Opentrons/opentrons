import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import { getPDMetadata } from '../file-types'
import type { Reducer } from 'redux'
import type { BaseState, Action } from '../types'
import type { LoadFileAction } from '../load-file'
import type { StepIdType } from '../form-types'
import type { DismissFormWarning, DismissTimelineWarning } from './actions'

export type WarningType = string

export interface DismissedWarningState {
  form: WarningType[]
  timeline: WarningType[]
}

//  these legacy types are used for the migration 8_1_0
type LegacyDismissedWarningsAllSteps = Record<
  StepIdType,
  WarningType[] | null | undefined
>
export interface LegacyDismissedWarningState {
  form: LegacyDismissedWarningsAllSteps
  timeline: LegacyDismissedWarningsAllSteps
}

// @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const dismissedWarnings: Reducer<DismissedWarningState, any> = handleActions(
  {
    DISMISS_FORM_WARNING: (
      state: DismissedWarningState,
      action: DismissFormWarning
    ): DismissedWarningState => {
      const { type } = action.payload
      return {
        ...state,
        form: state.form ? [...state.form, type] : [type],
      }
    },
    DISMISS_TIMELINE_WARNING: (
      state: DismissedWarningState,
      action: DismissTimelineWarning
    ): DismissedWarningState => {
      const { type } = action.payload
      return {
        ...state,
        timeline: state.timeline ? [...state.timeline, type] : [type],
      }
    },
    LOAD_FILE: (
      state: DismissedWarningState,
      action: LoadFileAction
    ): DismissedWarningState =>
      getPDMetadata(action.payload.file).dismissedWarnings,
  },
  {
    form: [],
    timeline: [],
  }
)
export const _allReducers = {
  dismissedWarnings,
}
export interface RootState {
  dismissedWarnings: DismissedWarningState
}
export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _allReducers
)
export const rootSelector = (state: BaseState): RootState => state.dismiss
