// @flow
import { createAction } from 'redux-actions'
import type { Wells } from '../labware-ingred/types'

// ===== Preselect / select wells in plate

// these actions all use PRIMARY WELLS (see reducers for definition)

export const highlightWells = createAction<'HIGHLIGHT_WELLS', Wells>(
  'HIGHLIGHT_WELLS'
)

export const selectWells = createAction<'SELECT_WELLS', Wells>('SELECT_WELLS')

export const deselectWells = createAction<'DESELECT_WELLS', Wells>(
  'DESELECT_WELLS'
)

export const deselectAllWells = createAction<'DESELECT_ALL_WELLS', void>(
  'DESELECT_ALL_WELLS'
)
