import { LabwareEntities, PipetteEntities } from '@opentrons/step-generation';
import { FormData } from '../../../form-types';
import { FormPatch } from '../../actions/types';
export declare function handleFormChange(patch: FormPatch, rawForm: FormData | null | undefined, pipetteEntities: PipetteEntities, labwareEntities: LabwareEntities): FormPatch;
