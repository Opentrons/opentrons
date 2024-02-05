import { ThunkAction } from '../../types';
import { StepIdType, StepFieldName } from '../../form-types';
import { BatchEditFormChangesState } from '../reducers';
export * from './modules';
export * from './pipettes';
export interface ChangeBatchEditFieldAction {
    type: 'CHANGE_BATCH_EDIT_FIELD';
    payload: BatchEditFormChangesState;
}
export declare const changeBatchEditField: (args: ChangeBatchEditFieldAction['payload']) => ChangeBatchEditFieldAction;
export interface ResetBatchEditFieldChangesAction {
    type: 'RESET_BATCH_EDIT_FIELD_CHANGES';
}
export declare const resetBatchEditFieldChanges: () => ResetBatchEditFieldChangesAction;
type EditedFields = Record<StepFieldName, unknown>;
export interface SaveStepFormsMultiAction {
    type: 'SAVE_STEP_FORMS_MULTI';
    payload: {
        stepIds: StepIdType[];
        editedFields: EditedFields;
    };
}
export declare const saveStepFormsMulti: (selectedStepIds?: StepIdType[] | null) => ThunkAction<SaveStepFormsMultiAction>;
