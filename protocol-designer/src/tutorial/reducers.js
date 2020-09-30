// @flow
import { combineReducers, type Reducer } from 'redux'
import { handleActions } from 'redux-actions'
import pickBy from 'lodash/pickBy'
import uniq from 'lodash/uniq'

import type { Action } from '../types'
import type { RehydratePersistedAction } from '../persist'
import type { HintKey } from './index'
import type { AddHintAction, RemoveHintAction } from './actions'
import type { NavigateToPageAction } from '../navigation/actions'

type HintReducerState = Array<HintKey>
const hints = handleActions(
  {
    ADD_HINT: (
      state: HintReducerState,
      action: AddHintAction
    ): HintReducerState => uniq([...state, action.payload.hintKey]),

    // going to the steplist page triggers 'deck_setup_explanation' hint
    NAVIGATE_TO_PAGE: (
      state: HintReducerState,
      action: NavigateToPageAction
    ): HintReducerState =>
      action.payload === 'steplist'
        ? uniq([...state, 'deck_setup_explanation'])
        : state,
  },
  []
)

type DismissedHintReducerState = { [HintKey]: { rememberDismissal: boolean } }
const dismissedHintsInitialState = {}
const dismissedHints: Reducer<DismissedHintReducerState, any> = handleActions(
  {
    // NOTE: only "rememberDismissal" hints should have been persisted
    REHYDRATE_PERSISTED: (
      state: DismissedHintReducerState,
      action: RehydratePersistedAction
    ) => {
      const persistedState = action.payload?.['tutorial.dismissedHints']
      return persistedState !== undefined ? persistedState : state
    },
    REMOVE_HINT: (
      state: DismissedHintReducerState,
      action: RemoveHintAction
    ): DismissedHintReducerState => {
      const { hintKey, rememberDismissal } = action.payload
      // TODO(IL 2020-02-24): consider using an immutable type for DismissedHintReducerState
      // to make this copy-mutate pattern less precarious, see #5073
      // (Flow won't let you do `return {...state, [hintKey]: spam})`) b/c it no longer
      // allows Unions as computed properties
      const nextState = { ...state }
      nextState[hintKey] = { rememberDismissal }
      return nextState
    },
    CLEAR_ALL_HINT_DISMISSALS: () => dismissedHintsInitialState,
  },
  dismissedHintsInitialState
)

export const dismissedHintsPersist = (
  state: DismissedHintReducerState
): DismissedHintReducerState => {
  // persist only 'rememberDismissal' hints
  return pickBy(
    state,
    (h: $Values<DismissedHintReducerState>) => h && h.rememberDismissal
  )
}

const _allReducers = {
  hints,
  dismissedHints,
}

export type RootState = {|
  hints: HintReducerState,
  dismissedHints: DismissedHintReducerState,
|}

export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _allReducers
)
