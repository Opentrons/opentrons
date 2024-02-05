import { StepType, StepIdType, FormData } from '../../../../form-types';
import { ThunkAction } from '../../../../types';
import { DuplicateStepAction, DuplicateMultipleStepsAction, SelectMultipleStepsAction } from '../types';
export declare const addAndSelectStepWithHints: (arg: {
    stepType: StepType;
}) => ThunkAction<any>;
export interface ReorderSelectedStepAction {
    type: 'REORDER_SELECTED_STEP';
    payload: {
        delta: number;
        stepId: StepIdType;
    };
}
export declare const reorderSelectedStep: (delta: number) => ThunkAction<ReorderSelectedStepAction>;
export declare const duplicateStep: (stepId: StepIdType) => ThunkAction<DuplicateStepAction>;
export declare const duplicateMultipleSteps: (stepIds: StepIdType[]) => ThunkAction<DuplicateMultipleStepsAction | SelectMultipleStepsAction>;
export declare const SAVE_STEP_FORM: 'SAVE_STEP_FORM';
export interface SaveStepFormAction {
    type: typeof SAVE_STEP_FORM;
    payload: FormData;
}
export declare const _saveStepForm: (form: FormData) => SaveStepFormAction;
/** take unsavedForm state and put it into the payload */
export declare const saveStepForm: () => ThunkAction<any>;
/** "power action", mimicking saving the never-saved "set temperature X" step,
 ** then creating and saving a "pause until temp X" step */
export declare const saveSetTempFormWithAddedPauseUntilTemp: () => ThunkAction<any>;
export declare const saveHeaterShakerFormWithAddedPauseUntilTemp: () => ThunkAction<any>;
