import * as React from 'react';
import { FormData, StepType, ProfileCycleItem, ProfileStepItem } from '../../form-types';
import { SubstepIdentifier, SubstepItemData, WellIngredientNames } from '../../steplist/types';
import type { AdditionalEquipmentEntities } from '@opentrons/step-generation';
export interface StepItemProps {
    description?: string | null;
    rawForm?: FormData | null;
    stepNumber: number;
    stepType: StepType;
    title?: string;
    collapsed?: boolean;
    error?: boolean | null;
    warning?: boolean | null;
    selected?: boolean;
    isLastSelected?: boolean;
    hovered?: boolean;
    isMultiSelectMode?: boolean;
    highlightStep: () => unknown;
    onStepContextMenu?: (event?: React.MouseEvent) => unknown;
    handleClick?: (event: React.MouseEvent) => unknown;
    toggleStepCollapsed: () => unknown;
    unhighlightStep: (event?: React.MouseEvent) => unknown;
    children?: React.ReactNode;
}
export declare const StepItem: (props: StepItemProps) => JSX.Element;
export interface StepItemContentsProps {
    rawForm: FormData | null | undefined;
    stepType: StepType;
    substeps: SubstepItemData | null | undefined;
    ingredNames: WellIngredientNames;
    labwareNicknamesById: {
        [labwareId: string]: string;
    };
    additionalEquipmentEntities: AdditionalEquipmentEntities;
    highlightSubstep: (substepIdentifier: SubstepIdentifier) => unknown;
    hoveredSubstep: SubstepIdentifier | null | undefined;
}
interface ProfileStepSubstepRowProps {
    step: ProfileStepItem;
    stepNumber: number;
    repetitionsDisplay: string | null | undefined;
}
export declare const ProfileStepSubstepRow: (props: ProfileStepSubstepRowProps) => JSX.Element;
interface ProfileCycleSubstepGroupProps {
    cycle: ProfileCycleItem;
    stepNumber: number;
}
export declare const ProfileCycleSubstepGroup: (props: ProfileCycleSubstepGroupProps) => JSX.Element;
export declare const StepItemContents: (props: StepItemContentsProps) => JSX.Element | JSX.Element[] | null;
export {};
