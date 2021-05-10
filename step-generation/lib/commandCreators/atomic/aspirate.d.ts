import type { AspirateParams } from '@opentrons/shared-data/protocol/types/schemaV3';
import type { CommandCreator } from '../../types';
/** Aspirate with given args. Requires tip. */
export declare const aspirate: CommandCreator<AspirateParams>;
