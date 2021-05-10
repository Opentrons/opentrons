import type { LabwareDefinition2 } from '@opentrons/shared-data';
import type { BlowoutParams } from '@opentrons/shared-data/protocol/types/schemaV4';
import type { CurriedCommandCreator, InvariantContext, LocationLiquidState, RobotState, SourceAndDest } from '../types';
export declare const AIR: '__air__';
export declare const SOURCE_WELL_BLOWOUT_DESTINATION: 'source_well';
export declare const DEST_WELL_BLOWOUT_DESTINATION: 'dest_well';
export declare function repeatArray<T>(array: T[], repeats: number): T[];
/** Total volume of a location ("air" is not included in the sum) */
export declare function getLocationTotalVolume(loc: LocationLiquidState): number;
/** Breaks a liquid volume state into 2 parts. Assumes all liquids are evenly mixed. */
export declare function splitLiquid(volume: number, sourceLiquidState: LocationLiquidState): SourceAndDest;
/** The converse of splitLiquid. Adds all of one liquid to the other.
 * The args are called 'source' and 'dest', but here they're interchangable.
 */
export declare function mergeLiquid(source: LocationLiquidState, dest: LocationLiquidState): LocationLiquidState;
export declare function getWellsForTips(channels: 1 | 8, labwareDef: LabwareDefinition2, well: string): {
    wellsForTips: string[];
    allWellsShared: boolean;
};
export declare const blowoutUtil: (args: {
    pipette: BlowoutParams['pipette'];
    sourceLabwareId: string;
    sourceWell: BlowoutParams['well'];
    destLabwareId: string;
    destWell: BlowoutParams['well'];
    blowoutLocation: string | null | undefined;
    flowRate: number;
    offsetFromTopMm: number;
    invariantContext: InvariantContext;
}) => CurriedCommandCreator[];
export declare function createEmptyLiquidState(invariantContext: InvariantContext): RobotState['liquidState'];
export declare function createTipLiquidState<T>(channels: number, contents: T): Record<string, T>;
export declare const getDispenseAirGapLocation: (args: {
    blowoutLocation: string | null | undefined;
    sourceLabware: string;
    destLabware: string;
    sourceWell: string;
    destWell: string;
}) => {
    dispenseAirGapLabware: string;
    dispenseAirGapWell: string;
};
export declare function makeInitialRobotState(args: {
    invariantContext: InvariantContext;
    labwareLocations: RobotState['labware'];
    moduleLocations: RobotState['modules'];
    pipetteLocations: RobotState['pipettes'];
}): RobotState;
