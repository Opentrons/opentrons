import type { RobotState, InvariantContext } from '../types';
declare type LiquidState = RobotState['liquidState'];
interface DispenseUpdateLiquidStateArgs {
    invariantContext: InvariantContext;
    prevLiquidState: LiquidState;
    labware: string;
    pipette: string;
    well: string;
    volume?: number;
    useFullVolume: boolean;
}
/** This is a helper to do dispense/blowout liquid state updates. */
export declare function dispenseUpdateLiquidState(args: DispenseUpdateLiquidStateArgs): void;
export {};
