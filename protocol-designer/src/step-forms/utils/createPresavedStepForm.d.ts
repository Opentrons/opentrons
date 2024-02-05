import { PipetteEntities, LabwareEntities, Timeline, AdditionalEquipmentEntities } from '@opentrons/step-generation';
import { FormData, StepType, StepIdType } from '../../form-types';
import { InitialDeckSetup } from '../types';
import { SavedStepFormState, OrderedStepIdsState } from '../reducers';
export interface CreatePresavedStepFormArgs {
    stepId: StepIdType;
    stepType: StepType;
    pipetteEntities: PipetteEntities;
    labwareEntities: LabwareEntities;
    savedStepForms: SavedStepFormState;
    orderedStepIds: OrderedStepIdsState;
    initialDeckSetup: InitialDeckSetup;
    robotStateTimeline: Timeline;
    additionalEquipmentEntities: AdditionalEquipmentEntities;
}
export declare const createPresavedStepForm: ({ initialDeckSetup, labwareEntities, orderedStepIds, pipetteEntities, savedStepForms, stepId, stepType, robotStateTimeline, additionalEquipmentEntities, }: CreatePresavedStepFormArgs) => FormData;
