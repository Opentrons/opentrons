// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import type {ActionType} from 'redux-actions'
import type {BaseState} from '../types'

import {dismissWarning} from './actions'
import type {DismissInfo} from './types'

export type DismissedWarningState = Array<DismissInfo>
const dismissedWarnings = handleActions({
  DISMISS_WARNING: (
    state: DismissedWarningState,
    action: ActionType<typeof dismissWarning>
  ): DismissedWarningState => [...state, action.payload]
}, [])

export const _allReducers = {
  dismissedWarnings
}

export type RootState = {
  dismissedWarnings: DismissedWarningState
}

const rootReducer = combineReducers(_allReducers)

export default rootReducer

export const rootSelector = (state: BaseState) => state.dismiss
