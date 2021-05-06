/** Utility fns to create reusable CommandCreatorErrors */
import type { CommandCreatorError } from './types';
export declare function insufficientTips(): CommandCreatorError;
export declare function noTipOnPipette(args: {
    actionName: string;
    pipette: string;
    labware: string;
    well: string;
}): CommandCreatorError;
export declare function pipetteDoesNotExist(args: {
    actionName: string;
    pipette: string;
}): CommandCreatorError;
export declare function invalidSlot(args: {
    actionName: string;
    slot: string;
}): CommandCreatorError;
export declare function labwareDoesNotExist(args: {
    actionName: string;
    labware: string;
}): CommandCreatorError;
export declare function missingModuleError(): CommandCreatorError;
export declare function missingTemperatureStep(): CommandCreatorError;
export declare function tipVolumeExceeded(args: {
    actionName: string;
    volume: string | number;
    maxVolume: string | number;
}): CommandCreatorError;
export declare function pipetteVolumeExceeded(args: {
    actionName: string;
    volume: string | number;
    maxVolume: string | number;
    disposalVolume?: string | number;
}): CommandCreatorError;
export declare const modulePipetteCollisionDanger: () => CommandCreatorError;
export declare const thermocyclerLidClosed: () => CommandCreatorError;
