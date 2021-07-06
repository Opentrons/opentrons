import omit from 'lodash/omit'
import { combineReducers, Reducer } from 'redux'
import { handleActions } from 'redux-actions'
import { WellGroup } from '@opentrons/components'
import { Action } from '../types'
import {
  HighlightWellsAction,
  SelectWellsAction,
  DeselectWellsAction,
} from './actions'
interface SelectedWellsState {
  highlighted: WellGroup
  selected: WellGroup
}

function deleteWells(
  initialWells: WellGroup,
  wellsToRemove: WellGroup
): WellGroup {
  // remove given wells from a set of wells
  return omit(initialWells, Object.keys(wellsToRemove))
}

// NOTE: selected wells state holds PRIMARY WELLS.
// The "primary well" is the well that the back-most tip of a multi-channel pipette goes into.
// For example, in the column A1, B1, C1, ... H1 in a 96 plate, A1 is the primary well.
const selectedWellsInitialState: SelectedWellsState = {
  highlighted: {},
  selected: {},
}
// @ts-expect-error(sa, 2021-6-21): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const selectedWells: Reducer<SelectedWellsState, Action> = handleActions(
  {
    HIGHLIGHT_WELLS: (
      state,
      action: HighlightWellsAction
    ): SelectedWellsState => ({ ...state, highlighted: action.payload }),
    SELECT_WELLS: (state, action: SelectWellsAction): SelectedWellsState => ({
      highlighted: {},
      selected: { ...state.selected, ...action.payload },
    }),
    DESELECT_WELLS: (
      state,
      action: DeselectWellsAction
    ): SelectedWellsState => ({
      highlighted: {},
      selected: deleteWells(state.selected, action.payload),
    }),
    // Actions that cause "deselect everything" behavior:
    CLOSE_INGREDIENT_SELECTOR: () => selectedWellsInitialState,
    DESELECT_ALL_WELLS: () => selectedWellsInitialState,
    REMOVE_WELLS_CONTENTS: () => selectedWellsInitialState,
    SET_WELL_CONTENTS: () => selectedWellsInitialState,
  },
  selectedWellsInitialState
)
export interface RootState {
  selectedWells: SelectedWellsState
}
export const rootReducer: Reducer<RootState, Action> = combineReducers({
  selectedWells,
})
