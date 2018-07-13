// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import omit from 'lodash/omit'
import {dismissWarning} from './actions'
import {getPDMetadata} from '../file-types'
import type {ActionType} from 'redux-actions'
import type {BaseState} from '../types'
import type {LoadFileAction} from '../load-file'
import type {CommandCreatorWarning} from '../step-generation'
import type {DeleteStepAction} from '../steplist/actions'

export type DismissedWarningState = {[stepId: number]: ?Array<CommandCreatorWarning>}
const dismissedWarnings = handleActions({
  DISMISS_WARNING: (
    state: DismissedWarningState,
    action: ActionType<typeof dismissWarning>
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
  DELETE_STEP: (state: DismissedWarningState, action: DeleteStepAction) => {
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
