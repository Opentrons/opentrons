// @flow
import omit from 'lodash/omit'
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'

import type {Wells} from '../labware-ingred/types'
import type {OpenWellSelectionModalPayload, WellSelectionPayload} from './actions'

type WellSelectionAction = {
  payload: WellSelectionPayload
}

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
  HIGHLIGHT_WELLS: (state, action: WellSelectionAction) =>
    ({...state, highlighted: action.payload.wells}),

  SELECT_WELLS: (state, action: WellSelectionAction) => ({
    highlighted: {},
    selected: {...state.selected, ...action.payload.wells}
  }),

  DESELECT_WELLS: (state, action: WellSelectionAction) => ({
    highlighted: {},
    selected: deleteWells(state.selected, action.payload.wells)
  }),
  // Actions that cause "deselect everything" behavior:
  EDIT_MODE_INGREDIENT_GROUP: () => selectedWellsInitialState,
  CLOSE_INGREDIENT_SELECTOR: () => selectedWellsInitialState,
  EDIT_INGREDIENT: () => selectedWellsInitialState,
  CLOSE_WELL_SELECTION_MODAL: () => selectedWellsInitialState
}, selectedWellsInitialState)

type WellSelectionModalState = OpenWellSelectionModalPayload | null
const wellSelectionModal = handleActions({
  OPEN_WELL_SELECTION_MODAL: (state, action: {payload: OpenWellSelectionModalPayload}) => action.payload,
  CLOSE_WELL_SELECTION_MODAL: () => null
}, null)

export type RootState = {|
  selectedWells: SelectedWellsState,
  wellSelectionModal: WellSelectionModalState
|}

const rootReducer = combineReducers({
  selectedWells,
  wellSelectionModal
})

export default rootReducer
