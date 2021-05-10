import type { AirGapParams, AspirateParams, BlowoutParams, DispenseParams, TouchTipParams } from '@opentrons/shared-data/protocol/types/schemaV3';
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6';
import type { CommandsAndWarnings, CommandCreatorErrorResponse } from '../types';
/** Used to wrap command creators in tests, effectively casting their results
 **  to normal response or error response
 **/
export declare function getSuccessResult(result: CommandsAndWarnings | CommandCreatorErrorResponse): CommandsAndWarnings;
export declare function getErrorResult(result: CommandsAndWarnings | CommandCreatorErrorResponse): CommandCreatorErrorResponse;
export declare const replaceTipCommands: (tip: number | string) => Command[];
export declare const BLOWOUT_FLOW_RATE = 2.3;
export declare const ASPIRATE_OFFSET_FROM_BOTTOM_MM = 3.1;
export declare const DISPENSE_OFFSET_FROM_BOTTOM_MM = 3.2;
export declare const BLOWOUT_OFFSET_FROM_TOP_MM = 3.3;
interface FlowRateAndOffsetParamsTransferlike {
    aspirateFlowRateUlSec: number;
    dispenseFlowRateUlSec: number;
    blowoutFlowRateUlSec: number;
    aspirateOffsetFromBottomMm: number;
    dispenseOffsetFromBottomMm: number;
    blowoutOffsetFromTopMm: number;
    touchTipAfterAspirateOffsetMmFromBottom: number;
    touchTipAfterDispenseOffsetMmFromBottom: number;
}
export declare const getFlowRateAndOffsetParamsTransferLike: () => FlowRateAndOffsetParamsTransferlike;
interface FlowRateAndOffsetParamsMix {
    aspirateFlowRateUlSec: number;
    dispenseFlowRateUlSec: number;
    blowoutFlowRateUlSec: number;
    aspirateOffsetFromBottomMm: number;
    dispenseOffsetFromBottomMm: number;
    blowoutOffsetFromTopMm: number;
    touchTipMmFromBottom: number;
}
export declare const getFlowRateAndOffsetParamsMix: () => FlowRateAndOffsetParamsMix;
export declare const DEFAULT_PIPETTE = "p300SingleId";
export declare const MULTI_PIPETTE = "p300MultiId";
export declare const SOURCE_LABWARE = "sourcePlateId";
export declare const DEST_LABWARE = "destPlateId";
export declare const TROUGH_LABWARE = "troughId";
export declare const FIXED_TRASH_ID = "trashId";
export declare const DEFAULT_BLOWOUT_WELL = "A1";
declare type MakeAspDispHelper<P> = (bakedParams?: Partial<P>) => (well: string, volume: number, params?: Partial<P>) => Command;
declare type MakeAirGapHelper<P> = (bakedParams: Partial<P> & {
    offsetFromBottomMm: number;
}) => (well: string, volume: number, params?: Partial<P>) => Command;
declare type MakeDispenseAirGapHelper<P> = MakeAirGapHelper<P>;
export declare const makeAspirateHelper: MakeAspDispHelper<AspirateParams>;
export declare const makeAirGapHelper: MakeAirGapHelper<AirGapParams>;
export declare const blowoutHelper: (labware?: string | null | undefined, params?: Partial<BlowoutParams> | undefined) => Command;
export declare const makeDispenseHelper: MakeAspDispHelper<DispenseParams>;
export declare const makeDispenseAirGapHelper: MakeDispenseAirGapHelper<AirGapParams>;
declare type MakeTouchTipHelper = (bakedParams?: Partial<TouchTipParams>) => (well: string, params?: Partial<TouchTipParams>) => Command;
export declare const makeTouchTipHelper: MakeTouchTipHelper;
export declare const delayCommand: (seconds: number) => Command;
export declare const delayWithOffset: (well: string, labware: string, seconds?: number | undefined, zOffset?: number | undefined) => Command[];
export declare const dropTipHelper: (well: string, params?: {
    pipette?: string | undefined;
    labware?: string | undefined;
} | undefined) => Command;
export declare const pickUpTipHelper: (tip: number | string, params?: {
    pipette?: string | undefined;
    labware?: string | undefined;
} | undefined) => Command;
export {};
