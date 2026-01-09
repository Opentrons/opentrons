import { isEqual } from 'lodash'
import pickBy from 'lodash/pickBy'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'

import type { Reducer } from 'redux'
import type { RehydratePersistedAction } from '../persist'
import type { Action } from '../types'
import type { AddHintAction, RemoveHintAction } from './actions'
import type { HintKey, HintParams } from './index'

type HintReducerState = HintParams[]

const hints = handleActions<HintReducerState, AddHintAction>(
  {
    //  @ts-expect-error
    ADD_HINT: (
      state: HintReducerState,
      action: AddHintAction
    ): HintReducerState => {
      const newHintParams = action.payload
      // Prevent adding exact duplicates.
      if (
        state.some(existingHintParams =>
          isEqual(existingHintParams, newHintParams)
        )
      ) {
        return state
      } else {
        return [...state, newHintParams]
      }
    },
  },
  []
) as Reducer<HintReducerState, Action>

export type DismissedHintReducerState = Record<
  HintKey,
  {
    rememberDismissal: boolean
  }
>

const dismissedHintsInitialState = {}

// @ts-expect-error(sa, 2021-6-21): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const dismissedHints: Reducer<DismissedHintReducerState, any> = handleActions(
  {
    // NOTE: only "rememberDismissal" hints should have been persisted
    REHYDRATE_PERSISTED: (
      state: DismissedHintReducerState,
      action: RehydratePersistedAction
    ) => {
      const persistedState = action.payload?.['tutorial.dismissedHints']
      return persistedState ?? state
    },
    REMOVE_HINT: (
      state: DismissedHintReducerState,
      action: RemoveHintAction
    ): DismissedHintReducerState => {
      const { hintKey, rememberDismissal } = action.payload
      return {
        ...state,
        [hintKey]: {
          rememberDismissal,
        },
      }
    },
    CLEAR_ALL_HINT_DISMISSALS: () => dismissedHintsInitialState,
  },
  dismissedHintsInitialState
)

export const dismissedHintsPersist = (
  state: DismissedHintReducerState
): Partial<DismissedHintReducerState> => {
  // persist only 'rememberDismissal' hints
  return pickBy(
    state,
    (h: DismissedHintReducerState[keyof DismissedHintReducerState]) =>
      h && h.rememberDismissal
  )
}

export interface RootState {
  hints: HintReducerState
  dismissedHints: DismissedHintReducerState
}

export const rootReducer: Reducer<RootState, Action> = combineReducers({
  hints,
  dismissedHints,
})
