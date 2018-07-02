// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import {dismissWarning} from './actions'
import type {ActionType} from 'redux-actions'
import type {BaseState} from '../types'
import type {CommandCreatorWarning} from '../step-generation'

export type DismissedWarningState = {[stepId: number]: Array<CommandCreatorWarning>}
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
  }
  // DELETE_STEP: () => {} // TODO IMMEDIATELY remove keys when step deleted!
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
