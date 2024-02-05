import { PathOption, StepType } from '../../../../form-types';
import { ChangeTipOptions } from '@opentrons/step-generation';
export interface DisabledChangeTipArgs {
    aspirateWells?: string[];
    dispenseWells?: string[];
    stepType?: StepType;
    path?: PathOption | null | undefined;
}
export declare const getDisabledChangeTipOptions: (args: DisabledChangeTipArgs) => Set<ChangeTipOptions> | null | undefined;
