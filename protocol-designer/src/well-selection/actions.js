// @flow
import { createAction } from 'redux-actions'
import type { WellGroup } from '@opentrons/components'

// ===== Preselect / select wells in plate

// these actions all use PRIMARY WELLS (see reducers for definition)

export const highlightWells = createAction<'HIGHLIGHT_WELLS', WellGroup>(
  'HIGHLIGHT_WELLS'
)

export const selectWells = createAction<'SELECT_WELLS', WellGroup>(
  'SELECT_WELLS'
)

export const deselectWells = createAction<'DESELECT_WELLS', WellGroup>(
  'DESELECT_WELLS'
)

export const deselectAllWells = createAction<'DESELECT_ALL_WELLS', void>(
  'DESELECT_ALL_WELLS'
)
