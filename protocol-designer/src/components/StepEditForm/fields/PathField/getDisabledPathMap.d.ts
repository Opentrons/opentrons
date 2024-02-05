import { ChangeTipOptions, PipetteEntities } from '@opentrons/step-generation';
import { PathOption } from '../../../../form-types';
export type DisabledPathMap = Partial<Record<PathOption, string>> | null;
export interface ValuesForPath {
    aspirate_airGap_checkbox?: boolean | null;
    aspirate_airGap_volume?: string | null;
    aspirate_wells?: string[] | null;
    changeTip: ChangeTipOptions;
    dispense_wells?: string[] | null;
    pipette?: string | null;
    volume?: string | null;
}
export declare function getDisabledPathMap(values: ValuesForPath, pipetteEntities: PipetteEntities, t: any): DisabledPathMap;
