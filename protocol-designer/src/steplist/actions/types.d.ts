import { StepFieldName } from '../fieldLevel';
export type FormPatch = Partial<Record<StepFieldName, unknown | null>>;
export interface ChangeFormPayload {
    stepId?: string;
    update: FormPatch;
}
