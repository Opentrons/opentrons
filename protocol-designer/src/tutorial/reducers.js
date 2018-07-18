// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'

type HintReducerState = Array<HintKey>
const hints = handleActions({
  ADD_HINT: (state: HintReducerState, action: EnqueueHintAction): HintReducerState => (
    [...state, action.payload.hint]
  ),
  REMOVE_HINT: (state: HintReducerState, action: DequeueHintAction): HintReducerState => (
    state.slice(1)
  )
})

type DismissedHintReducerState = Array<HintKey>
const dismissedHints = handleActions({
  REMOVE_HINT: (state: DismissedHintReducerState, action: DequeueHintAction): DismissedHintReducerState => (
    [...state, action.payload.hint]
  )
})

const _allReducers = {
  hints,
  dismissedHints
}

export type RootState = {
  hints: HintReducerState,
  dismissedHints: DismissedHintReducerState
}

export const rootReducer = combineReducers(_allReducers)
