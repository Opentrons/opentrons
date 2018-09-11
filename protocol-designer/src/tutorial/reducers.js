// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import uniq from 'lodash/uniq'
import without from 'lodash/without'
import type {EditIngredient} from '../labware-ingred/actions'
import type {HintKey} from './index'
import type {AddHintAction, RemoveHintAction} from './actions'

type HintReducerState = Array<HintKey>
const hints = handleActions({
  ADD_HINT: (state: HintReducerState, action: AddHintAction): HintReducerState => (
    uniq([...state, action.payload.hint])
  ),
  EDIT_INGREDIENT: (state: HintReducerState, action: EditIngredient) => (
    without(state, 'add_liquids_and_labware')
  )
}, [])

type DismissedHintReducerState = Array<HintKey>
const dismissedHints = handleActions({
  REMOVE_HINT: (state: DismissedHintReducerState, action: RemoveHintAction): DismissedHintReducerState => (
    uniq([...state, action.payload.hint])
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
