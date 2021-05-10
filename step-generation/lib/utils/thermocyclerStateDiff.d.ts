import type { ThermocyclerModuleState, ThermocyclerStateStepArgs } from '../types';
export interface Diff {
    lidOpen: boolean;
    lidClosed: boolean;
    setBlockTemperature: boolean;
    deactivateBlockTemperature: boolean;
    setLidTemperature: boolean;
    deactivateLidTemperature: boolean;
}
export declare const thermocyclerStateDiff: (prevThermocyclerState: ThermocyclerModuleState, args: ThermocyclerStateStepArgs) => Diff;
