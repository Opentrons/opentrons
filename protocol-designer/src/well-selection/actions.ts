import { WellGroup } from '@opentrons/components'
// ===== Preselect / select wells in plate
// these actions all use PRIMARY WELLS (see reducers for definition)
export interface HighlightWellsAction {
  type: 'HIGHLIGHT_WELLS'
  payload: WellGroup
}
export const highlightWells = (
  payload: HighlightWellsAction['payload']
): HighlightWellsAction => ({
  type: 'HIGHLIGHT_WELLS',
  payload,
})
export interface SelectWellsAction {
  type: 'SELECT_WELLS'
  payload: WellGroup
}
export const selectWells = (
  payload: SelectWellsAction['payload']
): SelectWellsAction => ({
  type: 'SELECT_WELLS',
  payload,
})
export interface DeselectWellsAction {
  type: 'DESELECT_WELLS'
  payload: WellGroup
}
export const deselectWells = (
  payload: DeselectWellsAction['payload']
): DeselectWellsAction => ({
  type: 'DESELECT_WELLS',
  payload,
})
export interface DeselectAllWellsAction {
  type: 'DESELECT_ALL_WELLS'
}
export const deselectAllWells = (): DeselectAllWellsAction => ({
  type: 'DESELECT_ALL_WELLS',
})
