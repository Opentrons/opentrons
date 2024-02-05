import { WellGroup } from '@opentrons/components';
export interface HighlightWellsAction {
    type: 'HIGHLIGHT_WELLS';
    payload: WellGroup;
}
export declare const highlightWells: (payload: HighlightWellsAction['payload']) => HighlightWellsAction;
export interface SelectWellsAction {
    type: 'SELECT_WELLS';
    payload: WellGroup;
}
export declare const selectWells: (payload: SelectWellsAction['payload']) => SelectWellsAction;
export interface DeselectWellsAction {
    type: 'DESELECT_WELLS';
    payload: WellGroup;
}
export declare const deselectWells: (payload: DeselectWellsAction['payload']) => DeselectWellsAction;
export interface DeselectAllWellsAction {
    type: 'DESELECT_ALL_WELLS';
}
export declare const deselectAllWells: () => DeselectAllWellsAction;
