import { SubstepIdentifier, TerminalItemId } from '../../steplist/types';
import { StepsState, CollapsedStepsState, HoverableItem } from './reducers';
import { CountPerStepType, StepFieldName, StepIdType, StepType } from '../../form-types';
import { BaseState, Selector } from '../../types';
export declare const rootSelector: (state: BaseState) => StepsState;
export declare const getSelectedStepId: Selector<StepIdType | null>;
export declare const getSelectedTerminalItemId: Selector<TerminalItemId | null>;
export declare const getIsMultiSelectMode: Selector<boolean>;
export declare const getMultiSelectItemIds: Selector<StepIdType[] | null>;
export declare const getMultiSelectLastSelected: Selector<StepIdType | null>;
export declare const getHoveredItem: Selector<HoverableItem | null>;
export declare const getHoveredStepId: Selector<StepIdType | null>;
/** Array of labware (labwareId's) involved in hovered Step, or [] */
export declare const getHoveredStepLabware: Selector<string[]>;
export declare const getHoveredTerminalItemId: Selector<TerminalItemId | null>;
export declare const getHoveredSubstep: Selector<SubstepIdentifier>;
export declare const getActiveItem: Selector<HoverableItem | null>;
export declare const getCollapsedSteps: Selector<CollapsedStepsState>;
interface StepTitleInfo {
    stepName: string;
    stepType: StepType;
}
export declare const getSelectedStepTitleInfo: Selector<StepTitleInfo | null>;
export declare const getWellSelectionLabwareKey: Selector<string | null>;
export type MultiselectFieldValues = Record<StepFieldName, {
    value?: any;
    isIndeterminate: boolean;
}>;
export declare const _getSavedMultiSelectFieldValues: Selector<MultiselectFieldValues | null>;
export declare const getMultiSelectFieldValues: Selector<MultiselectFieldValues | null>;
type TooltipText = string;
export type DisabledFields = Record<string, TooltipText>;
export declare const getMultiSelectDisabledFields: Selector<DisabledFields | null>;
export declare const getCountPerStepType: Selector<CountPerStepType>;
export declare const getBatchEditSelectedStepTypes: Selector<StepType[]>;
export {};
