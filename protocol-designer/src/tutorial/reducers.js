// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import without from 'lodash/without'
import type {HintKey} from './index'
import type {AddHintAction, RemoveHintAction} from './actions'

type HintReducerState = Array<HintKey>
const hints = handleActions({
  ADD_HINT: (state: HintReducerState, action: AddHintAction): HintReducerState => (
    [...state, action.payload.hint]
  ),
  REMOVE_HINT: (state: HintReducerState, action: RemoveHintAction): HintReducerState => (
    without(state, action.payload.hint)
  )
}, [])

type DismissedHintReducerState = Array<HintKey>
const dismissedHints = handleActions({
  REMOVE_HINT: (state: DismissedHintReducerState, action: RemoveHintAction): DismissedHintReducerState => (
    [...state, action.payload.hint]
  )
}, [])

const _allReducers = {
  hints,
  dismissedHints
}

export type RootState = {
  hints: HintReducerState,
  dismissedHints: DismissedHintReducerState
}

export const rootReducer = combineReducers(_allReducers)
