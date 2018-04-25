// @flow
import omit from 'lodash/omit'
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'

import type {Wells} from '../labware-ingred/types'
import * as actions from '../labware-ingred/actions'
import type {OpenWellSelectionModalPayload} from './actions'

type SelectedWellsState = {|
  highlighted: Wells,
  selected: Wells
|}

function deleteWells (initialWells: Wells, wellsToRemove: Wells): Wells {
  // remove given wells from a set of wells
  return omit(initialWells, Object.keys(wellsToRemove))
}

const selectedWellsInitialState: SelectedWellsState = {highlighted: {}, selected: {}}
const selectedWells = handleActions({
  HIGHLIGHT_WELLS: (state, action: ActionType<typeof actions.highlightWells>) =>
    ({...state, highlighted: action.payload.wells}),

  SELECT_WELLS: (state, action: ActionType<typeof actions.selectWells>) => ({
    highlighted: {},
    selected: {...state.selected, ...action.payload.wells}
  }),

  DESELECT_WELLS: (state, action: ActionType<typeof actions.deselectWells>) => ({
    highlighted: {},
    selected: deleteWells(state.selected, action.payload.wells)
  }),
  // Actions that cause "deselect everything" behavior:
  EDIT_MODE_INGREDIENT_GROUP: () => selectedWellsInitialState,
  CLOSE_INGREDIENT_SELECTOR: () => selectedWellsInitialState,
  EDIT_INGREDIENT: () => selectedWellsInitialState,
  CLOSE_WELL_SELECTION_MODAL: () => selectedWellsInitialState
}, selectedWellsInitialState)

type HighlightedIngredientsState = {wells: Wells}
const highlightedIngredients = handleActions({
  HOVER_WELL_BEGIN: (state, action: ActionType<typeof actions.hoverWellBegin>) => ({ wells: action.payload }),
  HOVER_WELL_END: (state, action: ActionType<typeof actions.hoverWellBegin>) => ({}) // clear highlighting
}, {})

type WellSelectionModalState = OpenWellSelectionModalPayload | null
const wellSelectionModal = handleActions({
  OPEN_WELL_SELECTION_MODAL: (state, action: {payload: OpenWellSelectionModalPayload}) => action.payload,
  CLOSE_WELL_SELECTION_MODAL: () => null
}, null)

export type RootState = {|
  selectedWells: SelectedWellsState,
  highlightedIngredients: HighlightedIngredientsState,
  wellSelectionModal: WellSelectionModalState
|}

const rootReducer = combineReducers({
  selectedWells,
  highlightedIngredients,
  wellSelectionModal
})

export default rootReducer
