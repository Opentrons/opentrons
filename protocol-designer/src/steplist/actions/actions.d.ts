import { ThunkAction } from '../../types';
import { StepIdType, FormData } from '../../form-types';
import { ChangeFormPayload } from './types';
import { ClearSelectedItemAction, SelectMultipleStepsAction } from '../../ui/steps';
export interface ChangeSavedStepFormAction {
    type: 'CHANGE_SAVED_STEP_FORM';
    payload: ChangeFormPayload;
}
export declare const changeSavedStepForm: (payload: ChangeFormPayload) => ChangeSavedStepFormAction;
export interface ChangeFormInputAction {
    type: 'CHANGE_FORM_INPUT';
    payload: ChangeFormPayload;
}
export declare const changeFormInput: (payload: ChangeFormPayload) => ChangeFormInputAction;
export interface PopulateFormAction {
    type: 'POPULATE_FORM';
    payload: FormData;
}
export interface DeleteStepAction {
    type: 'DELETE_STEP';
    payload: StepIdType;
}
export declare const deleteStep: (stepId: StepIdType) => DeleteStepAction;
export interface DeleteMultipleStepsAction {
    type: 'DELETE_MULTIPLE_STEPS';
    payload: StepIdType[];
}
export declare const deleteMultipleSteps: (stepIds: StepIdType[]) => ThunkAction<DeleteMultipleStepsAction | ClearSelectedItemAction | SelectMultipleStepsAction>;
export interface CancelStepFormAction {
    type: 'CANCEL_STEP_FORM';
    payload: null;
}
export declare const cancelStepForm: () => CancelStepFormAction;
export interface ReorderStepsAction {
    type: 'REORDER_STEPS';
    payload: {
        stepIds: StepIdType[];
    };
}
export declare const reorderSteps: (stepIds: StepIdType[]) => ReorderStepsAction;
export interface AddProfileStepAction {
    type: 'ADD_PROFILE_STEP';
    payload: null | {
        cycleId: string;
    };
}
export declare const addProfileStep: (payload: AddProfileStepAction['payload']) => AddProfileStepAction;
export interface DeleteProfileCycleAction {
    type: 'DELETE_PROFILE_CYCLE';
    payload: {
        id: string;
    };
}
export declare const deleteProfileCycle: (payload: DeleteProfileCycleAction['payload']) => DeleteProfileCycleAction;
export interface DeleteProfileStepAction {
    type: 'DELETE_PROFILE_STEP';
    payload: {
        id: string;
    };
}
export declare const deleteProfileStep: (payload: DeleteProfileStepAction['payload']) => DeleteProfileStepAction;
export interface EditProfileCycleAction {
    type: 'EDIT_PROFILE_CYCLE';
    payload: {
        id: string;
        fields: {
            repetitions?: string;
        };
    };
}
export declare const editProfileCycle: (payload: EditProfileCycleAction['payload']) => EditProfileCycleAction;
export interface EditProfileStepAction {
    type: 'EDIT_PROFILE_STEP';
    payload: {
        id: string;
        fields: {
            title?: string;
            temperature?: string;
            durationMinutes?: string;
            durationSeconds?: string;
        };
    };
}
export declare const editProfileStep: (payload: EditProfileStepAction['payload']) => EditProfileStepAction;
export interface AddProfileCycleAction {
    type: 'ADD_PROFILE_CYCLE';
    payload: null;
}
export declare const addProfileCycle: (payload: AddProfileCycleAction['payload']) => AddProfileCycleAction;
