import { StepIdType } from '../form-types';
interface Props {
    stepId: StepIdType;
    stepNumber: number;
    onStepContextMenu?: () => void;
}
export declare const ConnectedStepItem: (props: Props) => JSX.Element;
export declare function getMetaSelectedSteps(multiSelectItemIds: StepIdType[] | null, stepId: StepIdType, selectedStepId: StepIdType | null): StepIdType[];
export {};
