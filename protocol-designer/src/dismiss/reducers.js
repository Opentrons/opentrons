// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import omit from 'lodash/omit'

import type { Reducer } from 'redux'
import { getPDMetadata } from '../file-types'
import type { BaseState, Action } from '../types'
import type { LoadFileAction } from '../load-file'
import type { DeleteStepAction } from '../steplist/actions'
import type { StepIdType } from '../form-types'
import type { DismissFormWarning, DismissTimelineWarning } from './actions'

export type WarningType = string

export type DismissedWarningsAllSteps = {
  [stepId: StepIdType]: ?Array<WarningType>,
  ...,
}
export type DismissedWarningState = {|
  form: DismissedWarningsAllSteps,
  timeline: DismissedWarningsAllSteps,
|}

// NOTE(mc, 2020-06-04): `handleActions` cannot be strictly typed
const dismissedWarnings: Reducer<DismissedWarningState, any> = handleActions(
  {
    DISMISS_FORM_WARNING: (
      state: DismissedWarningState,
      action: DismissFormWarning
    ): DismissedWarningState => {
      const { stepId, type } = action.payload
      if (stepId == null) {
        console.warn('Tried to dismiss form warning with no stepId')
        return state
      }

      return {
        ...state,
        form: {
          ...state.form,
          [stepId]: [...(state.form[stepId] || []), type],
        },
      }
    },
    DISMISS_TIMELINE_WARNING: (
      state: DismissedWarningState,
      action: DismissTimelineWarning
    ): DismissedWarningState => {
      const { stepId, type } = action.payload
      if (stepId == null) {
        console.warn('Tried to dismiss timeline warning with no stepId')
        return state
      }
      return {
        ...state,
        timeline: {
          ...state.timeline,
          [stepId]: [...(state.timeline[stepId] || []), type],
        },
      }
    },
    DELETE_STEP: (
      state: DismissedWarningState,
      action: DeleteStepAction
    ): DismissedWarningState => {
      // remove key for deleted step
      const stepId = action.payload
      return {
        form: omit(state.form, stepId),
        timeline: omit(state.timeline, stepId),
      }
    },
    LOAD_FILE: (
      state: DismissedWarningState,
      action: LoadFileAction
    ): DismissedWarningState =>
      getPDMetadata(action.payload.file).dismissedWarnings,
  },
  { form: {}, timeline: {} }
)

export const _allReducers = {
  dismissedWarnings,
}

export type RootState = {|
  dismissedWarnings: DismissedWarningState,
|}

export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _allReducers
)

export const rootSelector = (state: BaseState): RootState => state.dismiss
