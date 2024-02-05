import type { StepIdType } from '../../form-types';
export interface StepListProps {
    isMultiSelectMode?: boolean | null;
    orderedStepIds: StepIdType[];
    reorderSelectedStep: (delta: number) => void;
    reorderSteps: (steps: StepIdType[]) => void;
}
export declare const StepList: () => JSX.Element;
