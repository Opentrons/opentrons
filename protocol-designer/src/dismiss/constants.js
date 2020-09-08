// @flow
export const UNSAVED_STEP_FORM_PSEUDO_ID = '__UNSAVED_FORM__'

export const getStepIdOrUnsaved = (stepId: ?string): string =>
  stepId || UNSAVED_STEP_FORM_PSEUDO_ID
