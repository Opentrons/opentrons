import { Timeline } from '@opentrons/step-generation';
import { StepIdType, StepType } from '../../../form-types';
import { TerminalItemId, SubstepIdentifier } from '../../../steplist/types';
interface AddStepPayload {
    id: string;
    stepType: StepType;
}
export interface AddStepAction {
    type: 'ADD_STEP';
    payload: AddStepPayload;
    meta: {
        robotStateTimeline: Timeline;
    };
}
export interface ClearWellSelectionLabwareKeyAction {
    type: 'CLEAR_WELL_SELECTION_LABWARE_KEY';
    payload: null;
}
interface DuplicateStepPayload {
    stepId: StepIdType;
    duplicateStepId: StepIdType;
}
export interface DuplicateStepAction {
    type: 'DUPLICATE_STEP';
    payload: DuplicateStepPayload;
}
export interface DuplicateMultipleStepsAction {
    type: 'DUPLICATE_MULTIPLE_STEPS';
    payload: {
        steps: DuplicateStepPayload[];
        indexToInsert: number;
    };
}
export interface ExpandAddStepButtonAction {
    type: 'EXPAND_ADD_STEP_BUTTON';
    payload: boolean;
}
export interface ToggleStepCollapsedAction {
    type: 'TOGGLE_STEP_COLLAPSED';
    payload: StepIdType;
}
export interface ExpandMultipleStepsAction {
    type: 'EXPAND_MULTIPLE_STEPS';
    payload: StepIdType[];
}
export interface CollapseMultipleStepsAction {
    type: 'COLLAPSE_MULTIPLE_STEPS';
    payload: StepIdType[];
}
export interface HoverOnSubstepAction {
    type: 'HOVER_ON_SUBSTEP';
    payload: SubstepIdentifier;
}
export interface ReorderSelectedStepAction {
    type: 'REORDER_SELECTED_STEP';
    payload: {
        delta: number;
        stepId: StepIdType;
    };
}
export interface ClearSelectedItemAction {
    type: 'CLEAR_SELECTED_ITEM';
}
export interface SelectTerminalItemAction {
    type: 'SELECT_TERMINAL_ITEM';
    payload: TerminalItemId;
}
export interface HoverOnStepAction {
    type: 'HOVER_ON_STEP';
    payload: StepIdType | null | undefined;
}
export interface HoverOnTerminalItemAction {
    type: 'HOVER_ON_TERMINAL_ITEM';
    payload: TerminalItemId | null | undefined;
}
export interface SetWellSelectionLabwareKeyAction {
    type: 'SET_WELL_SELECTION_LABWARE_KEY';
    payload: string | null | undefined;
}
export interface SelectStepAction {
    type: 'SELECT_STEP';
    payload: StepIdType;
}
export interface SelectMultipleStepsAction {
    type: 'SELECT_MULTIPLE_STEPS';
    payload: {
        stepIds: StepIdType[];
        lastSelected: StepIdType;
    };
}
export {};
