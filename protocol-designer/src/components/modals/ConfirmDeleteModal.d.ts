import * as React from 'react';
export declare const DELETE_PROFILE_CYCLE: 'deleteProfileCycle';
export declare const CLOSE_STEP_FORM_WITH_CHANGES: 'closeStepFormWithChanges';
export declare const CLOSE_UNSAVED_STEP_FORM: 'closeUnsavedStepForm';
export declare const CLOSE_BATCH_EDIT_FORM: 'closeBatchEditForm';
export declare const DELETE_STEP_FORM: 'deleteStepForm';
export declare const DELETE_MULTIPLE_STEP_FORMS: 'deleteMultipleStepForms';
export type DeleteModalType = typeof DELETE_PROFILE_CYCLE | typeof CLOSE_STEP_FORM_WITH_CHANGES | typeof CLOSE_UNSAVED_STEP_FORM | typeof DELETE_STEP_FORM | typeof CLOSE_BATCH_EDIT_FORM | typeof DELETE_MULTIPLE_STEP_FORMS;
interface Props {
    modalType: DeleteModalType;
    onCancelClick: () => unknown;
    onContinueClick: ((event: React.MouseEvent) => unknown) | (() => unknown);
}
export declare function ConfirmDeleteModal(props: Props): JSX.Element;
export {};
