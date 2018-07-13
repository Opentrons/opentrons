// @flow
import {combineReducers} from 'redux'
import {combineActions, handleActions} from 'redux-actions'
import omit from 'lodash/omit'
import type {
  DismissFormWarning,
  DismissTimelineWarning
} from './actions'
import {getPDMetadata} from '../file-types'
import type {BaseState} from '../types'
import type {LoadFileAction} from '../load-file'
import type {CommandCreatorWarning} from '../step-generation'
import type {FormWarning} from '../steplist'
import type {DeleteStepAction} from '../steplist/actions'

export type MixedWarnings = CommandCreatorWarning | FormWarning
type DismissedWarningState = {[stepId: number]: ?Array<MixedWarnings>}

const dismissedWarnings = handleActions({
  [combineActions('DISMISS_FORM_WARNING', 'DISMISS_TIMELINE_WARNING')]: (
    state: DismissedWarningState,
    action: DismissFormWarning | DismissTimelineWarning
  ): DismissedWarningState => {
    const {stepId, warning} = action.payload
    return {
      ...state,
      [stepId]: [
        ...(state[stepId] || []),
        warning
      ]
    }
  },
  DELETE_STEP: (state: DismissedWarningState, action: DeleteStepAction): DismissedWarningState => {
    // remove key for deleted step
    const stepId = action.payload.toString(10)
    return omit(state, stepId)
  },
  LOAD_FILE: (state: DismissedWarningState, action: LoadFileAction): DismissedWarningState =>
    getPDMetadata(action.payload).dismissedWarnings
}, {})

export const _allReducers = {
  dismissedWarnings
}

export type RootState = {
  dismissedWarnings: DismissedWarningState
}

const rootReducer = combineReducers(_allReducers)

export default rootReducer

export const rootSelector = (state: BaseState) => state.dismiss
