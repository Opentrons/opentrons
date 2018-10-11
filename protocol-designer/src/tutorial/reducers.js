// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import pickBy from 'lodash/pickBy'
import uniq from 'lodash/uniq'
import without from 'lodash/without'
import {rehydrate} from '../persist'
import type {EditIngredient} from '../labware-ingred/actions'
import type {HintKey} from './index'
import type {AddHintAction, RemoveHintAction} from './actions'

type HintReducerState = Array<HintKey>
const hints = handleActions({
  ADD_HINT: (state: HintReducerState, action: AddHintAction): HintReducerState => (
    uniq([...state, action.payload.hintKey])
  ),
  EDIT_INGREDIENT: (state: HintReducerState, action: EditIngredient) => (
    without(state, 'add_liquids_and_labware')
  ),
}, [])

type DismissedHintReducerState = {[HintKey]: {rememberDismissal: boolean}}
const dismissedHintsInitialState = {}
const dismissedHints = handleActions({
  // only rehydrate "rememberDismissal" hints
  REHYDRATE_PERSISTED: () => rehydrate('tutorial.dismissedHints', dismissedHintsInitialState),
  REMOVE_HINT: (state: DismissedHintReducerState, action: RemoveHintAction): DismissedHintReducerState => {
    const {hintKey, rememberDismissal} = action.payload
    return {...state, [hintKey]: {rememberDismissal}}
  },
}, dismissedHintsInitialState)

export function dismissedHintsPersist (state: DismissedHintReducerState) {
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

export type RootState = {
  hints: HintReducerState,
  dismissedHints: DismissedHintReducerState,
}

export const rootReducer = combineReducers(_allReducers)
