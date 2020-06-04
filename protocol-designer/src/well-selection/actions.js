// @flow
import { createAction } from 'redux-actions'
import type { WellGroup } from '@opentrons/components'

// ===== Preselect / select wells in plate

// these actions all use PRIMARY WELLS (see reducers for definition)
export type HighlightWellsAction = {
  type: 'HIGHLIGHT_WELLS',
  payload: WellGroup,
}
export const highlightWells = (
  payload: $PropertyType<HighlightWellsAction, 'payload'>
): HighlightWellsAction => ({
  type: 'HIGHLIGHT_WELLS',
  payload,
})

export type SelectWellsAction = {
  type: 'SELECT_WELLS',
  payload: WellGroup,
}
export const selectWells = (
  payload: $PropertyType<SelectWellsAction, 'payload'>
): SelectWellsAction => ({
  type: 'SELECT_WELLS',
  payload,
})

export type DeselectWellsAction = {
  type: 'DESELECT_WELLS',
  payload: WellGroup,
}
export const deselectWells = (
  payload: $PropertyType<DeselectWellsAction, 'payload'>
): DeselectWellsAction => ({
  type: 'DESELECT_WELLS',
  payload,
})

export type DeselectAllWellsAction = {
  type: 'DESELECT_ALL_WELLS',
}
export const deselectAllWells = (): DeselectAllWellsAction => ({
  type: 'DESELECT_ALL_WELLS',
})
