import type { AirGapParams } from '@opentrons/shared-data/protocol/types/schemaV3';
import type { CommandCreator } from '../../types';
/** Dispense with given args. Requires tip. */
export declare const dispenseAirGap: CommandCreator<AirGapParams>;
