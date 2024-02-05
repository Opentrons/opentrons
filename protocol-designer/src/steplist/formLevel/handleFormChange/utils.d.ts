import { LabwareDefinition2, PipetteChannels } from '@opentrons/shared-data';
import { LabwareEntities, PipetteEntities } from '@opentrons/step-generation';
import { FormPatch } from '../../actions/types';
import { FormData, PathOption, StepFieldName } from '../../../form-types';
export declare function chainPatchUpdaters(initialPatch: FormPatch, fns: Array<(arg0: FormPatch) => FormPatch>): FormPatch;
export declare function getAllWellsFromPrimaryWells(primaryWells: string[], labwareDef: LabwareDefinition2, channels: 8 | 96): string[];
export declare function getChannels(pipetteId: string, pipetteEntities: PipetteEntities): PipetteChannels | null | undefined;
export declare const DISPOSAL_VOL_DIGITS = 1;
export declare function getMaxDisposalVolumeForMultidispense(values: {
    aspirate_airGap_checkbox?: boolean | null;
    aspirate_airGap_volume?: string | null;
    path: PathOption;
    pipette: string | null;
    volume: string | null;
}, pipetteEntities: PipetteEntities): number | null | undefined;
export declare function volumeInCapacityForMulti(rawForm: FormData, pipetteEntities: PipetteEntities): boolean;
export declare function volumeInCapacityForMultiAspirate(args: {
    volume: number;
    pipetteCapacity: number;
    airGapVolume: number;
}): boolean;
export declare function volumeInCapacityForMultiDispense(args: {
    volume: number;
    pipetteCapacity: number;
    airGapVolume: number;
}): boolean;
interface GetDefaultWellsArgs {
    labwareId: string | null | undefined;
    pipetteId: string | null | undefined;
    labwareEntities: LabwareEntities;
    pipetteEntities: PipetteEntities;
}
export declare function getDefaultWells(args: GetDefaultWellsArgs): string[];
export declare function fieldHasChanged(rawForm: FormData, patch: FormPatch, fieldName: StepFieldName): boolean;
export {};
