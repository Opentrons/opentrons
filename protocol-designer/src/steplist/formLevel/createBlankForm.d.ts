import { StepType, StepIdType, FormData } from '../../form-types';
interface NewFormArgs {
    stepId: StepIdType;
    stepType: StepType;
}
export declare function createBlankForm(args: NewFormArgs): FormData;
export {};
