import { TEMPERATURE_APPROACHING_TARGET, TEMPERATURE_AT_TARGET, TEMPERATURE_DEACTIVATED } from '../constants';
import type { Config, InvariantContext, RobotState, RobotStateAndWarnings } from '../';
export declare const DEFAULT_CONFIG: Config;
declare type WellTipState = Record<string, boolean>;
export declare function getTiprackTipstate(filled: boolean | null | undefined): WellTipState;
export declare function getTipColumn<T>(index: number, filled: T): Record<string, T>;
export declare function makeContext(): InvariantContext;
export declare const makeState: (args: {
    invariantContext: InvariantContext;
    labwareLocations: RobotState['labware'];
    moduleLocations?: RobotState['modules'];
    pipetteLocations: RobotState['pipettes'];
    tiprackSetting: Record<string, boolean>;
}) => RobotState;
interface StandardMakeStateArgs {
    pipetteLocations: RobotState['pipettes'];
    labwareLocations: RobotState['labware'];
    moduleLocations: RobotState['modules'];
}
export declare const makeStateArgsStandard: () => StandardMakeStateArgs;
export declare const getInitialRobotStateStandard: (invariantContext: InvariantContext) => RobotState;
export declare const getRobotStateAndWarningsStandard: (invariantContext: InvariantContext) => RobotStateAndWarnings;
export declare const getRobotStateWithTipStandard: (invariantContext: InvariantContext) => RobotState;
export declare const getRobotStatePickedUpTipStandard: (invariantContext: InvariantContext) => RobotState;
export declare const getRobotInitialStateNoTipsRemain: (invariantContext: InvariantContext) => RobotState;
interface StateAndContext {
    robotState: RobotState;
    invariantContext: InvariantContext;
}
export declare const getStateAndContextTempTCModules: ({ temperatureModuleId, thermocyclerId, }: {
    temperatureModuleId: string;
    thermocyclerId: string;
}) => StateAndContext;
export declare const robotWithStatusAndTemp: (robotState: RobotState, temperatureModuleId: string, status: typeof TEMPERATURE_AT_TARGET | typeof TEMPERATURE_APPROACHING_TARGET | typeof TEMPERATURE_DEACTIVATED, targetTemperature: number | null) => RobotState;
export {};
