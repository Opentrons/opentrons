// @flow
import omit from 'lodash/omit'
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'

import type {Wells} from '../labware-ingred/types'
import type {OpenWellSelectionModalPayload} from './actions'

type WellSelectionAction = {
  payload: Wells, // NOTE: primary wells.
}

type SelectedWellsState = {
  highlighted: Wells,
  selected: Wells,
}

function deleteWells (initialWells: Wells, wellsToRemove: Wells): Wells {
  // remove given wells from a set of wells
  return omit(initialWells, Object.keys(wellsToRemove))
}

// NOTE: selected wells state holds PRIMARY WELLS.
// The "primary well" is the well that the back-most tip of a multi-channel pipette goes into.
// For example, in the column A1, B1, C1, ... H1 in a 96 plate, A1 is the primary well.
const selectedWellsInitialState: SelectedWellsState = {highlighted: {}, selected: {}}
const selectedWells = handleActions({
  HIGHLIGHT_WELLS: (state, action: WellSelectionAction): SelectedWellsState =>
    ({...state, highlighted: action.payload}),

  SELECT_WELLS: (state, action: WellSelectionAction): SelectedWellsState => ({
    highlighted: {},
    selected: {...state.selected, ...action.payload},
  }),

  DESELECT_WELLS: (state, action: WellSelectionAction): SelectedWellsState => ({
    highlighted: {},
    selected: deleteWells(state.selected, action.payload),
  }),
  // Actions that cause "deselect everything" behavior:
  EDIT_MODE_INGREDIENT_GROUP: () => selectedWellsInitialState,
  CLOSE_INGREDIENT_SELECTOR: () => selectedWellsInitialState,
  EDIT_INGREDIENT: () => selectedWellsInitialState,
  CLOSE_WELL_SELECTION_MODAL: () => selectedWellsInitialState,
  OPEN_RENAME_LABWARE_FORM: () => selectedWellsInitialState,
}, selectedWellsInitialState)

type WellSelectionModalState = OpenWellSelectionModalPayload | null
const wellSelectionModal = handleActions({
  OPEN_WELL_SELECTION_MODAL: (state, action: {payload: OpenWellSelectionModalPayload}) => action.payload,
  CLOSE_WELL_SELECTION_MODAL: () => null,
}, null)

export type RootState = {|
  selectedWells: SelectedWellsState,
  wellSelectionModal: WellSelectionModalState,
|}

const rootReducer = combineReducers({
  selectedWells,
  wellSelectionModal,
})

export default rootReducer
