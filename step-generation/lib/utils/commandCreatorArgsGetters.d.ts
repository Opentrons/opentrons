import type { CommandCreatorArgs } from '../types';
/** If command creator is of a type that uses a pipette, get the pipetteId */
export declare const getPipetteIdFromCCArgs: (args: CommandCreatorArgs) => string | null;
/** If command creator is of a type that doesn't ever have wells, return true */
export declare const getHasNoWellsFromCCArgs: (stepArgs: CommandCreatorArgs) => boolean;
