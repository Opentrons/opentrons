import type { MixArgs, CommandCreator, CurriedCommandCreator } from '../../types';
/** Helper fn to make mix command creators w/ minimal arguments */
export declare function mixUtil(args: {
    pipette: string;
    labware: string;
    well: string;
    volume: number;
    times: number;
    aspirateOffsetFromBottomMm: number;
    dispenseOffsetFromBottomMm: number;
    aspirateFlowRateUlSec: number;
    dispenseFlowRateUlSec: number;
    aspirateDelaySeconds?: number | null | undefined;
    dispenseDelaySeconds?: number | null | undefined;
}): CurriedCommandCreator[];
export declare const mix: CommandCreator<MixArgs>;
