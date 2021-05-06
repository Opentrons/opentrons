import type { MoveToWellParams } from '@opentrons/shared-data/lib/protocol/types/schemaV5';
import type { CommandCreator } from '../../types';
/** Move to specified well of labware, with optional offset and pathing options. */
export declare const moveToWell: CommandCreator<MoveToWellParams>;
