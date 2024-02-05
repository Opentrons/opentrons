import type { LabwareEntities, PipetteEntities } from '@opentrons/step-generation';
import { FormData } from '../../../form-types';
import { FormPatch } from '../../actions/types';
export declare function updatePatchPathField(patch: FormPatch, rawForm: FormData, pipetteEntities: PipetteEntities): FormPatch;
export declare function updatePatchBlowoutFields(patch: FormPatch, rawForm: FormData): FormPatch;
export declare function dependentFieldsUpdateMoveLiquid(originalPatch: FormPatch, rawForm: FormData, // raw = NOT hydrated
pipetteEntities: PipetteEntities, labwareEntities: LabwareEntities): FormPatch;
