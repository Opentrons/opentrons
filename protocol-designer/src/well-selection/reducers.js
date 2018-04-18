// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'

import type {Wells} from '../labware-ingred/types'
import * as actions from '../labware-ingred/actions'

type SelectedWellsState = {|
  preselected: Wells,
  selected: Wells
|}
const selectedWellsInitialState: SelectedWellsState = {preselected: {}, selected: {}}
const selectedWells = handleActions({
  PRESELECT_WELLS: (state, action: ActionType<typeof actions.preselectWells>) => action.payload.append
    ? {...state, preselected: action.payload.wells}
    : {selected: {}, preselected: action.payload.wells},

  SELECT_WELLS: (state, action: ActionType<typeof actions.selectWells>) => ({
    preselected: {},
    selected: {
      ...(action.payload.append ? state.selected : {}),
      ...action.payload.wells
    }
  }),
  // Actions that cause "deselect everything" behavior:
  EDIT_MODE_INGREDIENT_GROUP: (state, action: ActionType<typeof actions.editModeIngredientGroup>) =>
    selectedWellsInitialState,
  CLOSE_INGREDIENT_SELECTOR: () => selectedWellsInitialState,
  EDIT_INGREDIENT: () => selectedWellsInitialState
}, selectedWellsInitialState)

type HighlightedIngredientsState = {wells: Wells}
const highlightedIngredients = handleActions({
  HOVER_WELL_BEGIN: (state, action: ActionType<typeof actions.hoverWellBegin>) => ({ wells: action.payload }),
  HOVER_WELL_END: (state, action: ActionType<typeof actions.hoverWellBegin>) => ({}) // clear highlighting
}, {})

export type RootState = {|
  selectedWells: SelectedWellsState,
  highlightedIngredients: HighlightedIngredientsState
|}

const rootReducer = combineReducers({
  selectedWells,
  highlightedIngredients
})

export default rootReducer
