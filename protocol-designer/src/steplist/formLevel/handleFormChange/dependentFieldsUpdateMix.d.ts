import type { LabwareEntities, PipetteEntities } from '@opentrons/step-generation';
import type { FormData } from '../../../form-types';
import type { FormPatch } from '../../actions/types';
export declare function dependentFieldsUpdateMix(originalPatch: FormPatch, rawForm: FormData, // raw = NOT hydrated
pipetteEntities: PipetteEntities, labwareEntities: LabwareEntities): FormPatch;
