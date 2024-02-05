import { Reducer } from 'redux';
import { SubstepIdentifier, TerminalItemId } from '../../steplist/types';
import { Action } from '../../types';
import { StepIdType } from '../../form-types';
import { HoverOnSubstepAction } from './actions/types';
export type CollapsedStepsState = Record<StepIdType, boolean>;
export declare const SINGLE_STEP_SELECTION_TYPE: 'SINGLE_STEP_SELECTION_TYPE';
export declare const MULTI_STEP_SELECTION_TYPE: 'MULTI_STEP_SELECTION_TYPE';
export declare const TERMINAL_ITEM_SELECTION_TYPE: 'TERMINAL_ITEM_SELECTION_TYPE';
interface SingleSelectedItem {
    selectionType: typeof SINGLE_STEP_SELECTION_TYPE;
    id: StepIdType;
}
interface MultipleSelectedItem {
    selectionType: typeof MULTI_STEP_SELECTION_TYPE;
    ids: StepIdType[];
    lastSelected: StepIdType;
}
interface TerminalItem {
    selectionType: typeof TERMINAL_ITEM_SELECTION_TYPE;
    id: TerminalItemId;
}
export type SelectableItem = SingleSelectedItem | MultipleSelectedItem | TerminalItem;
type SelectedItemState = SelectableItem | null | undefined;
export type HoverableItem = SingleSelectedItem | TerminalItem;
export declare const initialSelectedItemState: {
    selectionType: "TERMINAL_ITEM_SELECTION_TYPE";
    id: "__initial_setup__";
};
type HoveredItemState = HoverableItem | null;
export interface StepsState {
    collapsedSteps: CollapsedStepsState;
    selectedItem: SelectedItemState;
    hoveredItem: HoveredItemState;
    hoveredSubstep: SubstepIdentifier;
    wellSelectionLabwareKey: string | null;
}
export declare const _allReducers: {
    collapsedSteps: Reducer<CollapsedStepsState, any>;
    selectedItem: Reducer<SelectedItemState, any>;
    hoveredItem: Reducer<HoveredItemState, any>;
    hoveredSubstep: Reducer<SubstepIdentifier, HoverOnSubstepAction>;
    wellSelectionLabwareKey: Reducer<string | null, any>;
};
export declare const rootReducer: Reducer<StepsState, Action>;
export {};
