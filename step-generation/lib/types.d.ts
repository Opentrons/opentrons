import type { Mount } from '@opentrons/components';
import { MAGNETIC_MODULE_TYPE, TEMPERATURE_MODULE_TYPE, THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data';
import type { LabwareDefinition2, ModuleRealType, ModuleModel, PipetteNameSpecs } from '@opentrons/shared-data';
import type { AtomicProfileStep, EngageMagnetParams, ModuleOnlyParams } from '@opentrons/shared-data//lib/protocol/types/schemaV4';
import type { Command } from '@opentrons/shared-data/lib/protocol/types/schemaV6';
import type { TEMPERATURE_DEACTIVATED, TEMPERATURE_AT_TARGET, TEMPERATURE_APPROACHING_TARGET } from './constants';
export declare type DeckSlot = string;
declare type THERMOCYCLER_STATE = 'thermocyclerState';
declare type THERMOCYCLER_PROFILE = 'thermocyclerProfile';
export interface LabwareTemporalProperties {
    slot: DeckSlot;
}
export interface PipetteTemporalProperties {
    mount: Mount;
}
export interface MagneticModuleState {
    type: typeof MAGNETIC_MODULE_TYPE;
    engaged: boolean;
}
export declare type TemperatureStatus = typeof TEMPERATURE_DEACTIVATED | typeof TEMPERATURE_AT_TARGET | typeof TEMPERATURE_APPROACHING_TARGET;
export interface TemperatureModuleState {
    type: typeof TEMPERATURE_MODULE_TYPE;
    status: TemperatureStatus;
    targetTemperature: number | null;
}
export interface ThermocyclerModuleState {
    type: typeof THERMOCYCLER_MODULE_TYPE;
    blockTargetTemp: number | null;
    lidTargetTemp: number | null;
    lidOpen: boolean | null;
}
export interface ModuleTemporalProperties {
    slot: DeckSlot;
    moduleState: MagneticModuleState | TemperatureModuleState | ThermocyclerModuleState;
}
export interface LabwareEntity {
    id: string;
    labwareDefURI: string;
    def: LabwareDefinition2;
}
export interface LabwareEntities {
    [labwareId: string]: LabwareEntity;
}
export interface ModuleEntity {
    id: string;
    type: ModuleRealType;
    model: ModuleModel;
}
export interface ModuleEntities {
    [moduleId: string]: ModuleEntity;
}
export interface NormalizedPipetteById {
    [pipetteId: string]: {
        name: string;
        id: string;
        tiprackDefURI: string;
    };
}
export declare type NormalizedPipette = NormalizedPipetteById[keyof NormalizedPipetteById];
export declare type PipetteEntity = NormalizedPipette & {
    tiprackLabwareDef: LabwareDefinition2;
    spec: PipetteNameSpecs;
};
export interface PipetteEntities {
    [pipetteId: string]: PipetteEntity;
}
export declare type ChangeTipOptions = 'always' | 'once' | 'never' | 'perDest' | 'perSource';
export interface InnerMixArgs {
    volume: number;
    times: number;
}
export interface InnerDelayArgs {
    seconds: number;
    mmFromBottom: number;
}
interface CommonArgs {
    /** Optional user-readable name for this step */
    name: string | null | undefined;
    /** Optional user-readable description/notes for this step */
    description: string | null | undefined;
}
export declare type SharedTransferLikeArgs = CommonArgs & {
    pipette: string;
    sourceLabware: string;
    destLabware: string;
    /** volume is interpreted differently by different Step types */
    volume: number;
    /** Pre-wet tip with ??? uL liquid from the first source well. */
    preWetTip: boolean;
    /** Touch tip after every aspirate */
    touchTipAfterAspirate: boolean;
    /** Optional offset for touch tip after aspirate (if null, use PD default) */
    touchTipAfterAspirateOffsetMmFromBottom: number;
    /** changeTip is interpreted differently by different Step types */
    changeTip: ChangeTipOptions;
    /** Delay after every aspirate */
    aspirateDelay: InnerDelayArgs | null | undefined;
    /** Air gap after every aspirate */
    aspirateAirGapVolume: number | null;
    /** Flow rate in uL/sec for all aspirates */
    aspirateFlowRateUlSec: number;
    /** offset from bottom of well in mm */
    aspirateOffsetFromBottomMm: number;
    /** Air gap after dispense */
    dispenseAirGapVolume: number | null;
    /** Delay after every dispense */
    dispenseDelay: InnerDelayArgs | null | undefined;
    /** Touch tip in destination well after dispense */
    touchTipAfterDispense: boolean;
    /** Optional offset for touch tip after dispense (if null, use PD default) */
    touchTipAfterDispenseOffsetMmFromBottom: number;
    /** Flow rate in uL/sec for all dispenses */
    dispenseFlowRateUlSec: number;
    /** offset from bottom of well in mm */
    dispenseOffsetFromBottomMm: number;
};
export declare type ConsolidateArgs = SharedTransferLikeArgs & {
    commandCreatorFnName: 'consolidate';
    sourceWells: string[];
    destWell: string;
    /** If given, blow out in the specified destination after dispense at the end of each asp-asp-dispense cycle */
    blowoutLocation: string | null | undefined;
    blowoutFlowRateUlSec: number;
    blowoutOffsetFromTopMm: number;
    /** Mix in first well in chunk */
    mixFirstAspirate: InnerMixArgs | null | undefined;
    /** Mix in destination well after dispense */
    mixInDestination: InnerMixArgs | null | undefined;
};
export declare type TransferArgs = SharedTransferLikeArgs & {
    commandCreatorFnName: 'transfer';
    sourceWells: string[];
    destWells: string[];
    /** If given, blow out in the specified destination after dispense at the end of each asp-dispense cycle */
    blowoutLocation: string | null | undefined;
    blowoutFlowRateUlSec: number;
    blowoutOffsetFromTopMm: number;
    /** Mix in first well in chunk */
    mixBeforeAspirate: InnerMixArgs | null | undefined;
    /** Mix in destination well after dispense */
    mixInDestination: InnerMixArgs | null | undefined;
};
export declare type DistributeArgs = SharedTransferLikeArgs & {
    commandCreatorFnName: 'distribute';
    sourceWell: string;
    destWells: string[];
    /** Disposal volume is added to the volume of the first aspirate of each asp-asp-disp cycle */
    disposalVolume: number | null | undefined;
    /** pass to blowout **/
    /** If given, blow out in the specified destination after dispense at the end of each asp-dispense cycle */
    blowoutLocation: string | null | undefined;
    blowoutFlowRateUlSec: number;
    blowoutOffsetFromTopMm: number;
    /** Mix in first well in chunk */
    mixBeforeAspirate: InnerMixArgs | null | undefined;
};
export declare type MixArgs = CommonArgs & {
    commandCreatorFnName: 'mix';
    labware: string;
    pipette: string;
    wells: string[];
    /** Mix volume (should not exceed pipette max) */
    volume: number;
    /** Times to mix (should be integer) */
    times: number;
    /** Touch tip after mixing */
    touchTip: boolean;
    touchTipMmFromBottom: number;
    /** change tip: see comments in step-generation/mix.js */
    changeTip: ChangeTipOptions;
    /** If given, blow out in the specified destination after mixing each well */
    blowoutLocation: string | null | undefined;
    blowoutFlowRateUlSec: number;
    blowoutOffsetFromTopMm: number;
    /** offset from bottom of well in mm */
    aspirateOffsetFromBottomMm: number;
    dispenseOffsetFromBottomMm: number;
    /** flow rates in uL/sec */
    aspirateFlowRateUlSec: number;
    dispenseFlowRateUlSec: number;
    /** delays */
    aspirateDelaySeconds: number | null | undefined;
    dispenseDelaySeconds: number | null | undefined;
};
export declare type PauseArgs = CommonArgs & {
    commandCreatorFnName: 'delay';
    message?: string;
    wait: number | true;
    pauseTemperature?: number | null;
    meta: {
        hours?: number;
        minutes?: number;
        seconds?: number;
    } | null | undefined;
};
export interface AwaitTemperatureArgs {
    module: string | null;
    commandCreatorFnName: 'awaitTemperature';
    temperature: number;
    message?: string;
}
export declare type EngageMagnetArgs = EngageMagnetParams & {
    module: string | null;
    commandCreatorFnName: 'engageMagnet';
    message?: string;
};
export declare type DisengageMagnetArgs = ModuleOnlyParams & {
    module: string | null;
    commandCreatorFnName: 'disengageMagnet';
    message?: string;
};
export interface SetTemperatureArgs {
    module: string | null;
    commandCreatorFnName: 'setTemperature';
    targetTemperature: number;
    message?: string;
}
export interface DeactivateTemperatureArgs {
    module: string | null;
    commandCreatorFnName: 'deactivateTemperature';
    message?: string;
}
declare const PROFILE_CYCLE: 'profileCycle';
declare const PROFILE_STEP: 'profileStep';
interface ProfileStepItem {
    type: typeof PROFILE_STEP;
    id: string;
    title: string;
    temperature: string;
    durationMinutes: string;
    durationSeconds: string;
}
interface ProfileCycleItem {
    type: typeof PROFILE_CYCLE;
    id: string;
    steps: ProfileStepItem[];
    repetitions: string;
}
export declare type ProfileItem = ProfileStepItem | ProfileCycleItem;
export interface ThermocyclerProfileStepArgs {
    module: string;
    commandCreatorFnName: THERMOCYCLER_PROFILE;
    blockTargetTempHold: number | null;
    lidOpenHold: boolean;
    lidTargetTempHold: number | null;
    message?: string;
    profileSteps: AtomicProfileStep[];
    profileTargetLidTemp: number;
    profileVolume: number;
    meta?: {
        rawProfileItems: ProfileItem[];
    };
}
export interface ThermocyclerStateStepArgs {
    module: string;
    commandCreatorFnName: THERMOCYCLER_STATE;
    blockTargetTemp: number | null;
    lidTargetTemp: number | null;
    lidOpen: boolean;
    message?: string;
}
export declare type CommandCreatorArgs = ConsolidateArgs | DistributeArgs | MixArgs | PauseArgs | TransferArgs | EngageMagnetArgs | DisengageMagnetArgs | SetTemperatureArgs | AwaitTemperatureArgs | DeactivateTemperatureArgs | ThermocyclerProfileStepArgs | ThermocyclerStateStepArgs;
export interface LocationLiquidState {
    [ingredGroup: string]: {
        volume: number;
    };
}
export interface SingleLabwareLiquidState {
    [well: string]: LocationLiquidState;
}
export interface LabwareLiquidState {
    [labwareId: string]: SingleLabwareLiquidState;
}
export interface SourceAndDest {
    source: LocationLiquidState;
    dest: LocationLiquidState;
}
export interface Config {
    OT_PD_DISABLE_MODULE_RESTRICTIONS: boolean;
}
export interface InvariantContext {
    labwareEntities: LabwareEntities;
    moduleEntities: ModuleEntities;
    pipetteEntities: PipetteEntities;
    config: Config;
}
export interface RobotState {
    pipettes: {
        [pipetteId: string]: PipetteTemporalProperties;
    };
    labware: {
        [labwareId: string]: LabwareTemporalProperties;
    };
    modules: {
        [moduleId: string]: ModuleTemporalProperties;
    };
    tipState: {
        tipracks: {
            [labwareId: string]: {
                [wellName: string]: boolean;
            };
        };
        pipettes: {
            [pipetteId: string]: boolean;
        };
    };
    liquidState: {
        pipettes: {
            [pipetteId: string]: {
                /** tips are numbered 0-7. 0 is the furthest to the back of the robot.
                 * For an 8-channel, on a 96-flat, Tip 0 is in row A, Tip 7 is in row H.
                 */
                [tipId: string]: LocationLiquidState;
            };
        };
        labware: {
            [labwareId: string]: {
                [well: string]: LocationLiquidState;
            };
        };
    };
}
export declare type ErrorType = 'INSUFFICIENT_TIPS' | 'LABWARE_DOES_NOT_EXIST' | 'MISMATCHED_SOURCE_DEST_WELLS' | 'MISSING_MODULE' | 'MODULE_PIPETTE_COLLISION_DANGER' | 'NO_TIP_ON_PIPETTE' | 'PIPETTE_DOES_NOT_EXIST' | 'PIPETTE_VOLUME_EXCEEDED' | 'TIP_VOLUME_EXCEEDED' | 'MISSING_TEMPERATURE_STEP' | 'THERMOCYCLER_LID_CLOSED' | 'INVALID_SLOT';
export interface CommandCreatorError {
    message: string;
    type: ErrorType;
}
export declare type WarningType = 'ASPIRATE_MORE_THAN_WELL_CONTENTS' | 'ASPIRATE_FROM_PRISTINE_WELL';
export interface CommandCreatorWarning {
    message: string;
    type: WarningType;
}
export interface CommandsAndRobotState {
    commands: Command[];
    robotState: RobotState;
    warnings?: CommandCreatorWarning[];
}
export interface CommandCreatorErrorResponse {
    errors: CommandCreatorError[];
    warnings?: CommandCreatorWarning[];
}
export interface CommandsAndWarnings {
    commands: Command[];
    warnings?: CommandCreatorWarning[];
}
export declare type CommandCreatorResult = CommandsAndWarnings | CommandCreatorErrorResponse;
export declare type CommandCreator<Args> = (args: Args, invariantContext: InvariantContext, prevRobotState: RobotState) => CommandCreatorResult;
export declare type CurriedCommandCreator = (invariantContext: InvariantContext, prevRobotState: RobotState) => CommandCreatorResult;
export interface Timeline {
    timeline: CommandsAndRobotState[];
    errors?: CommandCreatorError[] | null;
}
export interface RobotStateAndWarnings {
    robotState: RobotState;
    warnings: CommandCreatorWarning[];
}
export declare type WellOrderOption = 'l2r' | 'r2l' | 't2b' | 'b2t';
export {};
