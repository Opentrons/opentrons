import { NormalizedPipetteById } from '@opentrons/step-generation';
import { StepIdType } from '../../form-types';
export interface CreatePipettesAction {
    type: 'CREATE_PIPETTES';
    payload: NormalizedPipetteById;
}
export declare const createPipettes: (payload: CreatePipettesAction['payload']) => CreatePipettesAction;
export interface DeletePipettesAction {
    type: 'DELETE_PIPETTES';
    payload: string[];
}
export declare const deletePipettes: (payload: DeletePipettesAction['payload']) => DeletePipettesAction;
export interface SubstituteStepFormPipettesAction {
    type: 'SUBSTITUTE_STEP_FORM_PIPETTES';
    payload: {
        startStepId: StepIdType;
        endStepId: StepIdType;
        substitutionMap: Record<string, string>;
    };
}
export declare const substituteStepFormPipettes: (payload: SubstituteStepFormPipettesAction['payload']) => SubstituteStepFormPipettesAction;
